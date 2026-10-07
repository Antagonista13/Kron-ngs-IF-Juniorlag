-- Leader message opt-in; no shared read status or player rollout changes.
alter table public.push_config add column leader_delivery_enabled boolean not null default false;
create function public.push_active_recipient(who uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles f where f.id=who and f.is_active and
 (f.role in ('admin','coach') or (f.role='player' and exists(select 1 from players p where p.profile_id=f.id and p.is_active))))
$$;
create function public.push_delivery_allowed(who uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from push_config c join profiles f on f.id=who where
 c.delivery_enabled or c.pilot_profile_id=who or (c.leader_delivery_enabled and f.role in ('admin','coach')))
$$;
revoke all on function public.push_active_recipient(uuid),public.push_delivery_allowed(uuid) from public,anon,authenticated;
grant execute on function public.push_active_recipient(uuid),public.push_delivery_allowed(uuid) to service_role;
create or replace function public.register_push_subscription(endpoint text,p256dh text,auth text) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; owner uuid;
begin
 if not push_active_recipient(auth.uid()) then raise insufficient_privilege using message='Active player or leader required';end if;
 if not push_valid_endpoint(endpoint) or p256dh !~ '^[A-Za-z0-9_-]{87}$' or auth !~ '^[A-Za-z0-9_-]{22}$' then raise invalid_parameter_value using message='Invalid push subscription';end if;
 -- Serialize endpoint registration; never transfer an endpoint to another account.
 perform pg_advisory_xact_lock(hashtextextended(endpoint,0));
 select s.profile_id into owner from push_subscriptions s where s.endpoint=register_push_subscription.endpoint;
 if owner is not null and owner<>auth.uid() then raise insufficient_privilege using message='Endpoint belongs to another account';end if;
 insert into push_subscriptions(profile_id,endpoint,p256dh,auth) values(auth.uid(),endpoint,p256dh,auth)
 on conflict on constraint push_subscriptions_endpoint_key do update set p256dh=excluded.p256dh,auth=excluded.auth,enabled=true,created_at=now() returning id into result;
 return result;
end $$;

create or replace function public.set_push_preferences(posts boolean,messages boolean) returns public.push_preferences language plpgsql security definer set search_path=public as $$
declare result push_preferences;
begin
 if not push_active_recipient(auth.uid()) then raise insufficient_privilege;end if;
 if not push_active_player(auth.uid()) then posts:=false;end if;
 insert into push_preferences(profile_id,posts_enabled,messages_enabled) values(auth.uid(),posts,messages)
 on conflict(profile_id) do update set
 posts_enabled_at=case when excluded.posts_enabled and not push_preferences.posts_enabled then now() else push_preferences.posts_enabled_at end,
 messages_enabled_at=case when excluded.messages_enabled and not push_preferences.messages_enabled then now() else push_preferences.messages_enabled_at end,
 posts_enabled=excluded.posts_enabled,messages_enabled=excluded.messages_enabled returning * into result;
 return result;
end $$;

create or replace function public.get_push_status() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if not push_active_recipient(auth.uid()) then raise insufficient_privilege;end if;
 select jsonb_build_object('posts_enabled',coalesce(p.posts_enabled,false),'messages_enabled',coalesce(p.messages_enabled,false),'unread_count',(select count(*) from push_notifications n where n.profile_id=auth.uid() and push_notification_eligible(n)),'public_key',c.public_key,'delivery_enabled',push_delivery_allowed(auth.uid())) into result from push_config c left join push_preferences p on p.profile_id=auth.uid();
 return result;
end $$;

create or replace function public.get_push_test_subscription(owner_id uuid,subscription_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'id',s.id,'kind','test','unread_count',(select count(*) from push_notifications n where n.profile_id=owner_id and push_notification_eligible(n))) from push_subscriptions s cross join push_config c where s.id=subscription_id and s.profile_id=owner_id and s.enabled and push_active_recipient(owner_id) and push_delivery_allowed(owner_id)
$$;

create or replace function public.push_notification_eligible(n public.push_notifications) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles f join push_preferences pref on pref.profile_id=f.id
 where f.id=n.profile_id and push_active_recipient(f.id) and f.team=n.team and n.read_at is null and
 ((n.kind='post' and push_active_player(f.id) and pref.posts_enabled and n.created_at>=pref.posts_enabled_at and exists(select 1 from team_posts t where t.id=n.source_id and t.team=f.team and t.created_by<>f.id))
 or(n.kind='message' and pref.messages_enabled and n.created_at>=pref.messages_enabled_at and exists(
  select 1 from player_chat_messages m join player_chat_conversations c on c.id=m.conversation_id
  join players pl on pl.id=c.player_id join profiles player_profile on player_profile.id=pl.profile_id
  join profiles sender on sender.id=m.sender_profile_id
  where m.id=n.source_id and pl.is_active and player_profile.is_active and player_profile.role='player'
  and player_profile.team=f.team and sender.is_active and sender.team=f.team and sender.id<>f.id
  and ((f.role='player' and f.id=pl.profile_id and sender.role in ('admin','coach'))
   or(f.role in ('admin','coach') and sender.role='player' and sender.id=pl.profile_id))
  and not exists(select 1 from player_chat_reads r where r.message_id=m.id and r.reader_profile_id=f.id)))))
$$;

create or replace function public.capture_push_event() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_table_name='team_posts' then
  insert into push_notifications(profile_id,kind,source_id,team)
  select f.id,'post',new.id,f.team from profiles f join push_preferences pref on pref.profile_id=f.id
  where f.team=new.team and f.id<>new.created_by and push_active_player(f.id) and pref.posts_enabled and new.created_at>=pref.posts_enabled_at
  on conflict do nothing;
 elsif tg_table_name='player_chat_messages' then
  insert into push_notifications(profile_id,kind,source_id,team)
  select f.id,'message',new.id,f.team
  from player_chat_conversations c join players pl on pl.id=c.player_id
  join profiles player_profile on player_profile.id=pl.profile_id
  join profiles sender on sender.id=new.sender_profile_id
  join profiles f on f.team=player_profile.team
  join push_preferences pref on pref.profile_id=f.id
  where c.id=new.conversation_id and pl.is_active and player_profile.is_active and player_profile.role='player'
  and sender.is_active and sender.team=f.team and sender.id<>f.id and push_active_recipient(f.id)
  and pref.messages_enabled and new.created_at>=pref.messages_enabled_at
  and ((f.role='player' and f.id=pl.profile_id and sender.role in ('admin','coach'))
   or(f.role in ('admin','coach') and sender.role='player' and sender.id=pl.profile_id))
  on conflict do nothing;
 end if;
 -- No delivery backlog accumulated while rollout is stopped.
 insert into push_delivery_jobs(notification_id,subscription_id)
 select n.id,s.id from push_notifications n join push_subscriptions s on s.profile_id=n.profile_id cross join push_config cfg
 where n.source_id=new.id and s.enabled and n.created_at>=s.created_at and push_delivery_allowed(n.profile_id)
 on conflict do nothing;
 return new;
end $$;

create or replace function public.claim_push_jobs(batch_size integer) returns setof public.push_delivery_jobs language plpgsql security definer set search_path=public as $$
begin
 update push_delivery_jobs set state='failed',lease_until=null,lease_token=null where state='leased' and lease_until<now() and attempts>=4;
 return query with due as (
 select j.id from push_delivery_jobs j join push_notifications n on n.id=j.notification_id cross join push_config cfg
 where push_delivery_allowed(n.profile_id) and j.available_at<=now() and j.attempts<4 and (j.state='pending' or(j.state='leased' and j.lease_until<now()))
 order by j.available_at limit greatest(0,least(batch_size,100)) for update of j skip locked
 ) update push_delivery_jobs j set state='leased',attempts=j.attempts+1,lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid() from due where j.id=due.id returning j.*;
end $$;

create or replace function public.get_push_delivery(job_id uuid,token uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'id',n.id,'kind',n.kind,'source_id',n.source_id,'unread_count',(select count(*) from push_notifications unread where unread.profile_id=n.profile_id and push_notification_eligible(unread)))
 from push_delivery_jobs j join push_notifications n on n.id=j.notification_id join push_subscriptions s on s.id=j.subscription_id cross join push_config cfg
 where j.id=job_id and j.state='leased' and j.lease_token=token and j.lease_until>now() and s.enabled and s.profile_id=n.profile_id and n.created_at>=s.created_at and push_notification_eligible(n) and push_delivery_allowed(n.profile_id)
$$;

create or replace function public.wake_push_worker() returns void language plpgsql security definer set search_path=public,net,vault as $$
declare cfg push_config; secret text;
begin
 select * into cfg from push_config;
 if not cfg.delivery_enabled and cfg.pilot_profile_id is null and not cfg.leader_delivery_enabled then return;end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='kif_push_worker_token';
 perform net.http_post(url:=cfg.function_url,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),body:='{}'::jsonb,timeout_milliseconds:=10000);
exception when others then
 -- Delivery is best effort; never abort a post/message transaction on a wake failure.
 null;
end $$;
