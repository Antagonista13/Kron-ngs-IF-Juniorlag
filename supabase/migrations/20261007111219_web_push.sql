-- Additive opt-in Web Push. Original content tables are never rewritten.
create table public.push_config (
 singleton boolean primary key default true check(singleton),
 delivery_enabled boolean not null default false,
 pilot_profile_id uuid references public.profiles(id),
 public_key text,
 contact text,
 function_url text not null default 'https://ndbwnsiqcnxppikdrwvd.supabase.co/functions/v1/kif-push'
);
insert into public.push_config(singleton) values(true);
create table public.push_preferences (
 profile_id uuid primary key references public.profiles(id) on delete cascade,
 posts_enabled boolean not null default false,
 messages_enabled boolean not null default false,
 enabled_at timestamptz not null default now(),
 posts_enabled_at timestamptz not null default now(),
 messages_enabled_at timestamptz not null default now()
);
create table public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 endpoint text not null unique,
 p256dh text not null,
 auth text not null,
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
create index push_subscriptions_owner on public.push_subscriptions(profile_id) where enabled;
create table public.push_notifications (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 kind text not null check(kind in ('post','message')),
 source_id uuid not null,
 team text not null,
 created_at timestamptz not null default now(),
 read_at timestamptz,
 unique(profile_id,kind,source_id)
);
create index push_notifications_unread on public.push_notifications(profile_id) where read_at is null;
create table public.push_delivery_jobs (
 id uuid primary key default gen_random_uuid(),
 notification_id uuid not null references public.push_notifications(id) on delete cascade,
 subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
 state text not null default 'pending' check(state in ('pending','leased','sent','skipped','failed')),
 attempts int not null default 0,
 available_at timestamptz not null default now(),
 lease_until timestamptz,
 lease_token uuid,
 last_http_status int,
 unique(notification_id,subscription_id)
);
create index push_jobs_due on public.push_delivery_jobs(available_at) where state in ('pending','leased');

alter table public.push_config enable row level security;
alter table public.push_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_notifications enable row level security;
alter table public.push_delivery_jobs enable row level security;
revoke all on public.push_config,public.push_preferences,public.push_subscriptions,public.push_notifications,public.push_delivery_jobs from anon,authenticated;
grant select on public.push_preferences,public.push_subscriptions,public.push_notifications to authenticated;
grant all on public.push_config,public.push_preferences,public.push_subscriptions,public.push_notifications,public.push_delivery_jobs to service_role;
create policy push_preferences_owner on public.push_preferences for select to authenticated using(profile_id=(select auth.uid()));
create policy push_subscriptions_owner on public.push_subscriptions for select to authenticated using(profile_id=(select auth.uid()));
create policy push_notifications_owner on public.push_notifications for select to authenticated using(profile_id=(select auth.uid()));

create function public.push_active_player(who uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles f join players p on p.profile_id=f.id where f.id=who and f.role='player' and f.is_active and p.is_active)
$$;
create function public.push_valid_endpoint(value text) returns boolean language sql immutable set search_path=public as $$
 select length(value) between 40 and 2048 and value ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.apple\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)/[A-Za-z0-9_~./%?=&+-]+$'
$$;
create function public.register_push_subscription(endpoint text,p256dh text,auth text) returns uuid language plpgsql security definer set search_path=public as $$
declare result uuid; owner uuid;
begin
 if not push_active_player(auth.uid()) then raise insufficient_privilege using message='Active player required';end if;
 if not push_valid_endpoint(endpoint) or p256dh !~ '^[A-Za-z0-9_-]{87}$' or auth !~ '^[A-Za-z0-9_-]{22}$' then raise invalid_parameter_value using message='Invalid push subscription';end if;
 -- Serialize endpoint registration; never transfer an endpoint to another account.
 perform pg_advisory_xact_lock(hashtextextended(endpoint,0));
 select s.profile_id into owner from push_subscriptions s where s.endpoint=register_push_subscription.endpoint;
 if owner is not null and owner<>auth.uid() then raise insufficient_privilege using message='Endpoint belongs to another account';end if;
 insert into push_subscriptions(profile_id,endpoint,p256dh,auth) values(auth.uid(),endpoint,p256dh,auth)
 on conflict on constraint push_subscriptions_endpoint_key do update set p256dh=excluded.p256dh,auth=excluded.auth,enabled=true,created_at=now() returning id into result;
 return result;
end $$;
create function public.disable_push_subscription(endpoint text) returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 update push_subscriptions s set enabled=false where s.profile_id=auth.uid() and s.endpoint=disable_push_subscription.endpoint;
end $$;
create function public.set_push_preferences(posts boolean,messages boolean) returns public.push_preferences language plpgsql security definer set search_path=public as $$
declare result push_preferences;
begin
 if not push_active_player(auth.uid()) then raise insufficient_privilege;end if;
 insert into push_preferences(profile_id,posts_enabled,messages_enabled) values(auth.uid(),posts,messages)
 on conflict(profile_id) do update set
 posts_enabled_at=case when excluded.posts_enabled and not push_preferences.posts_enabled then now() else push_preferences.posts_enabled_at end,
 messages_enabled_at=case when excluded.messages_enabled and not push_preferences.messages_enabled then now() else push_preferences.messages_enabled_at end,
 posts_enabled=excluded.posts_enabled,messages_enabled=excluded.messages_enabled returning * into result;
 return result;
end $$;
create function public.push_notification_eligible(n public.push_notifications) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles f join players pl on pl.profile_id=f.id join push_preferences pref on pref.profile_id=f.id
 where f.id=n.profile_id and f.role='player' and f.is_active and pl.is_active and f.team=n.team and n.read_at is null
 and ((n.kind='post' and pref.posts_enabled and n.created_at>=pref.posts_enabled_at and exists(select 1 from team_posts t where t.id=n.source_id and t.team=f.team and t.created_by<>f.id))
 or(n.kind='message' and pref.messages_enabled and n.created_at>=pref.messages_enabled_at and exists(select 1 from player_chat_messages m join player_chat_conversations c on c.id=m.conversation_id join profiles sender on sender.id=m.sender_profile_id where m.id=n.source_id and c.player_id=pl.id and sender.role in ('admin','coach') and sender.is_active and sender.team=f.team and m.sender_profile_id<>f.id and not exists(select 1 from player_chat_reads r where r.message_id=m.id and r.reader_profile_id=f.id)))))
$$;
create function public.get_push_status() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if not push_active_player(auth.uid()) then raise insufficient_privilege;end if;
 select jsonb_build_object('posts_enabled',coalesce(p.posts_enabled,false),'messages_enabled',coalesce(p.messages_enabled,false),'unread_count',(select count(*) from push_notifications n where n.profile_id=auth.uid() and push_notification_eligible(n)),'public_key',c.public_key,'delivery_enabled',c.delivery_enabled or coalesce(c.pilot_profile_id=auth.uid(),false)) into result from push_config c left join push_preferences p on p.profile_id=auth.uid();
 return result;
end $$;
create function public.mark_push_post_read(post_id uuid) returns bigint language plpgsql security definer set search_path=public as $$
begin
 if not push_active_player(auth.uid()) or not exists(select 1 from team_posts t join profiles p on p.id=auth.uid() where t.id=post_id and t.team=p.team) then raise insufficient_privilege;end if;
 update push_notifications n set read_at=now() where n.profile_id=auth.uid() and n.kind='post' and n.source_id=post_id and read_at is null;
 return (get_push_status()->>'unread_count')::bigint;
end $$;
create function public.configure_push_keys(public_key text,private_key text,contact text) returns void language plpgsql security definer set search_path=public,vault as $$
declare secret_id uuid;
begin
 if public_key !~ '^[A-Za-z0-9_-]{87}$' or private_key !~ '^[A-Za-z0-9_-]{43}$' or (length(contact)>200 or contact !~ '^(mailto:[^[:space:]]+@[^[:space:]]+|https://antagonista13\.github\.io/Kron-ngs-IF-Juniorlag/)$') then raise invalid_parameter_value;end if;
 select id into secret_id from vault.secrets where name='kif_push_vapid_private';
 if secret_id is null then perform vault.create_secret(private_key,'kif_push_vapid_private');else perform vault.update_secret(secret_id,private_key);end if;
 update push_config c set public_key=configure_push_keys.public_key,contact=configure_push_keys.contact;
end $$;
create function public.get_push_worker_config() returns jsonb language sql stable security definer set search_path=public,vault as $$
 select jsonb_build_object('public_key',c.public_key,'private_key',(select decrypted_secret from vault.decrypted_secrets where name='kif_push_vapid_private'),'worker_token',(select decrypted_secret from vault.decrypted_secrets where name='kif_push_worker_token'),'contact',c.contact,'delivery_enabled',c.delivery_enabled,'pilot_profile_id',c.pilot_profile_id) from push_config c
$$;
-- Secret generated on the server; never returned to the client.
do $$begin perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'kif_push_worker_token');end $$;

-- All helpers default closed. Explicit player/service entry points only.
do $$declare r record;begin
 for r in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in('push_active_player','push_valid_endpoint','push_notification_eligible','register_push_subscription','disable_push_subscription','set_push_preferences','get_push_status','mark_push_post_read','configure_push_keys','get_push_worker_config') loop
 execute format('revoke all on function %s from public,anon,authenticated',r.signature);
 execute format('grant execute on function %s to service_role',r.signature);
 end loop;
end $$;
grant execute on function public.register_push_subscription(text,text,text),public.disable_push_subscription(text),public.set_push_preferences(boolean,boolean),public.get_push_status(),public.mark_push_post_read(uuid) to authenticated;

create function public.capture_push_event() returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid; own_team text;
begin
 if tg_table_name='team_posts' then
  insert into push_notifications(profile_id,kind,source_id,team)
  select f.id,'post',new.id,f.team from profiles f join push_preferences pref on pref.profile_id=f.id
  where f.team=new.team and f.id<>new.created_by and push_active_player(f.id) and pref.posts_enabled and new.created_at>=pref.posts_enabled_at
  on conflict do nothing;
 elsif tg_table_name='player_chat_messages' then
  select pl.profile_id,f.team into recipient,own_team from player_chat_conversations c join players pl on pl.id=c.player_id join profiles f on f.id=pl.profile_id join profiles sender on sender.id=new.sender_profile_id
  where c.id=new.conversation_id and sender.role in ('admin','coach') and sender.is_active and sender.team=f.team and sender.id<>f.id;
  insert into push_notifications(profile_id,kind,source_id,team)
  select recipient,'message',new.id,own_team from push_preferences pref where pref.profile_id=recipient and pref.messages_enabled and new.created_at>=pref.messages_enabled_at and push_active_player(recipient)
  on conflict do nothing;
 end if;
 -- No delivery backlog accumulated while rollout is stopped.
 insert into push_delivery_jobs(notification_id,subscription_id)
 select n.id,s.id from push_notifications n join push_subscriptions s on s.profile_id=n.profile_id cross join push_config cfg
 where n.source_id=new.id and s.enabled and n.created_at>=s.created_at and (cfg.delivery_enabled or cfg.pilot_profile_id=n.profile_id)
 on conflict do nothing;
 return new;
end $$;
create trigger kif_push_post_insert after insert on public.team_posts for each row execute function public.capture_push_event();
create trigger kif_push_message_insert after insert on public.player_chat_messages for each row execute function public.capture_push_event();
create function public.capture_push_read() returns trigger language plpgsql security definer set search_path=public as $$
begin update push_notifications set read_at=new.read_at where profile_id=new.reader_profile_id and kind='message' and source_id=new.message_id and read_at is null;return new;end $$;
create trigger kif_push_message_read after insert on public.player_chat_reads for each row execute function public.capture_push_read();

create function public.claim_push_jobs(batch_size integer) returns setof public.push_delivery_jobs language plpgsql security definer set search_path=public as $$
begin
 update push_delivery_jobs set state='failed',lease_until=null,lease_token=null where state='leased' and lease_until<now() and attempts>=4;
 return query with due as (
 select j.id from push_delivery_jobs j join push_notifications n on n.id=j.notification_id cross join push_config cfg
 where (cfg.delivery_enabled or cfg.pilot_profile_id=n.profile_id) and j.available_at<=now() and j.attempts<4 and (j.state='pending' or(j.state='leased' and j.lease_until<now()))
 order by j.available_at limit greatest(0,least(batch_size,100)) for update of j skip locked
 ) update push_delivery_jobs j set state='leased',attempts=j.attempts+1,lease_until=now()+interval '2 minutes',lease_token=gen_random_uuid() from due where j.id=due.id returning j.*;
end $$;
create function public.get_push_delivery(job_id uuid,token uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'id',n.id,'kind',n.kind,'source_id',n.source_id,'unread_count',(select count(*) from push_notifications unread where unread.profile_id=n.profile_id and push_notification_eligible(unread)))
 from push_delivery_jobs j join push_notifications n on n.id=j.notification_id join push_subscriptions s on s.id=j.subscription_id cross join push_config cfg
 where j.id=job_id and j.state='leased' and j.lease_token=token and j.lease_until>now() and s.enabled and s.profile_id=n.profile_id and n.created_at>=s.created_at and push_notification_eligible(n) and (cfg.delivery_enabled or cfg.pilot_profile_id=n.profile_id)
$$;
create function public.finish_push_job(job_id uuid,token uuid,outcome text,http_status integer) returns void language plpgsql security definer set search_path=public as $$
declare j push_delivery_jobs;
begin
 select * into j from push_delivery_jobs where id=job_id and state='leased' and lease_token=token and lease_until>now() for update;
 if j.id is null then raise insufficient_privilege using message='Lease expired or invalid';end if;
 if outcome not in ('sent','skipped','failed','expired','retry') then raise invalid_parameter_value;end if;
 if outcome='expired' then update push_subscriptions set enabled=false where id=j.subscription_id;end if;
 update push_delivery_jobs set state=case when outcome='retry' and attempts<4 then 'pending' when outcome='sent' then 'sent' when outcome='skipped' then 'skipped' else 'failed' end,
 available_at=case when outcome='retry' and attempts<4 then now()+make_interval(secs=>case attempts when 1 then 60 when 2 then 300 else 1800 end) else available_at end,
 lease_token=null,lease_until=null,last_http_status=http_status where id=j.id;
end $$;
create function public.get_push_test_subscription(owner_id uuid,subscription_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('endpoint',s.endpoint,'p256dh',s.p256dh,'auth',s.auth,'id',s.id,'kind','test','unread_count',(select count(*) from push_notifications n where n.profile_id=owner_id and push_notification_eligible(n))) from push_subscriptions s cross join push_config c where s.id=subscription_id and s.profile_id=owner_id and s.enabled and push_active_player(owner_id) and (c.delivery_enabled or c.pilot_profile_id=owner_id)
$$;
create function public.wake_push_worker() returns void language plpgsql security definer set search_path=public,net,vault as $$
declare cfg push_config; secret text;
begin
 select * into cfg from push_config;
 if not cfg.delivery_enabled and cfg.pilot_profile_id is null then return;end if;
 select decrypted_secret into secret from vault.decrypted_secrets where name='kif_push_worker_token';
 perform net.http_post(url:=cfg.function_url,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret),body:='{}'::jsonb,timeout_milliseconds:=10000);
exception when others then
 -- Delivery is best effort; never abort a post/message transaction on a wake failure.
 null;
end $$;
create function public.wake_push_job() returns trigger language plpgsql security definer set search_path=public as $$
begin perform wake_push_worker();return null;end $$;
create trigger kif_push_job_wake after insert on public.push_delivery_jobs for each statement execute function public.wake_push_job();
select cron.schedule('kif-push-dispatch','* * * * *','select public.wake_push_worker()');

do $$declare r record;begin
 for r in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in('capture_push_event','capture_push_read','claim_push_jobs','get_push_delivery','finish_push_job','get_push_test_subscription','wake_push_worker','wake_push_job') loop
 execute format('revoke all on function %s from public,anon,authenticated',r.signature);
 execute format('grant execute on function %s to service_role',r.signature);
 end loop;
end $$;
