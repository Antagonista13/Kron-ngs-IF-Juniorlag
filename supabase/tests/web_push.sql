begin;
do $$
declare p uuid; other_p uuid; coach uuid; own_team text; post uuid; sub uuid; visible int; conv uuid; msg uuid; old_token uuid; j record;
begin
 set local role anon;
 begin perform public.get_push_status();raise exception 'Anonymous access allowed';exception when insufficient_privilege then null;end;
 reset role;
 select id,team into p,own_team from profiles where role='player' and is_active order by id limit 1;
 select id into other_p from profiles where role='player' and is_active and id<>p order by id limit 1;
 select id into coach from profiles where role in ('coach','admin') and is_active and team=own_team order by id limit 1;
 perform set_config('request.jwt.claim.sub',p::text,true);set local role authenticated;
 sub:=public.register_push_subscription('https://fcm.googleapis.com/fcm/send/kif-sql-fixture',repeat('A',87),repeat('B',22));
 if sub is null then raise exception 'Registration failed';end if;
 if sub<>public.register_push_subscription('https://fcm.googleapis.com/fcm/send/kif-sql-fixture',repeat('A',87),repeat('B',22)) then raise exception 'Duplicate not idempotent';end if;
 begin perform public.register_push_subscription('https://127.0.0.1/private',repeat('A',87),repeat('B',22));raise exception 'Unsafe endpoint allowed';exception when invalid_parameter_value then null;end;
 perform public.set_push_preferences(true,true);
 perform set_config('request.jwt.claim.sub',other_p::text,true);
 select count(*) into visible from push_subscriptions where id=sub;if visible<>0 then raise exception 'Other player sees subscription';end if;
 select count(*) into visible from push_preferences where profile_id=p;if visible<>0 then raise exception 'Other player sees preferences';end if;
 begin update push_preferences set posts_enabled=false where profile_id=p;raise exception 'Direct write allowed';exception when insufficient_privilege then null;end;
 begin perform public.register_push_subscription('https://fcm.googleapis.com/fcm/send/kif-sql-fixture',repeat('A',87),repeat('B',22));raise exception 'Subscription takeover';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',coach::text,true);
 perform public.register_push_subscription('https://fcm.googleapis.com/fcm/send/leader-fixture',repeat('A',87),repeat('B',22));
 reset role;
 perform set_config('request.jwt.claim.sub',p::text,true);
 if (public.get_push_status()->>'unread_count')::int<>0 then raise exception 'Backlog created on activation';end if;
 reset role;
 if to_regprocedure('public.capture_push_event()') is not null then
 -- Generate a new post through an existing publication API as the real same-team leader.
 perform set_config('request.jwt.claim.sub',coach::text,true);set local role authenticated;
 select (public.leader_create_team_post('Push SQL fixture','Temporary rolled-back fixture',false,null)).id into post;
 reset role;
 if not exists(select 1 from push_notifications where profile_id=p and source_id=post and kind='post') then raise exception 'Same-team notification missing';end if;
 if exists(select 1 from push_notifications where profile_id=coach and source_id=post) then raise exception 'Sender notified';end if;
 perform set_config('request.jwt.claim.sub',p::text,true);set local role authenticated;
 if (public.get_push_status()->>'unread_count')::int<>1 then raise exception 'Unread count incorrect';end if;
 reset role;
 if exists(select 1 from push_delivery_jobs) then raise exception 'Delivery created while disabled';end if;
 update push_config set pilot_profile_id=p;
 -- Editing must not enqueue a second event.
 update team_posts set title='Edited SQL fixture' where id=post;
 if (select count(*) from push_notifications where source_id=post)<>1 then raise exception 'Edit retriggered notification';end if;
 -- A fresh opted-in event has one job; recipient and lease are revalidated.
 perform set_config('request.jwt.claim.sub',coach::text,true);
 select (public.leader_create_team_post('Lease fixture','Temporary',false,null)).id into post;
 select * into j from public.claim_push_jobs(100) limit 1;
 if j.id is null then raise exception 'Pilot job missing';end if;
 if exists(select 1 from public.claim_push_jobs(100)) then raise exception 'Concurrent lease duplicated';end if;
 if public.get_push_delivery(j.id,j.lease_token) is null then raise exception 'Eligible delivery missing';end if;
 if public.get_push_delivery(j.id,gen_random_uuid()) is not null then raise exception 'Wrong lease exposed destination';end if;
 begin perform public.finish_push_job(j.id,gen_random_uuid(),'sent',201);raise exception 'Wrong lease accepted';exception when insufficient_privilege then null;end;
 update profiles set team='Fixture other team' where id=p;
 if public.get_push_delivery(j.id,j.lease_token) is not null then raise exception 'Team change ignored';end if;
 update profiles set team=own_team where id=p;
 perform public.finish_push_job(j.id,j.lease_token,'retry',503);
 if not exists(select 1 from push_delivery_jobs where id=j.id and state='pending' and attempts=1 and available_at>=now()+interval '1 minute') then raise exception 'Retry policy failed';end if;
 update push_delivery_jobs set available_at=now() where id=j.id;
 select * into j from public.claim_push_jobs(100) limit 1;
 old_token:=j.lease_token;
 update push_delivery_jobs set lease_until=now()-interval '1 second' where id=j.id;
 if public.get_push_delivery(j.id,old_token) is not null then raise exception 'Expired lease exposed delivery';end if;
 select * into j from public.claim_push_jobs(100) limit 1;
 if j.lease_token=old_token or j.attempts<>3 then raise exception 'Interrupted lease recovery failed';end if;
 perform public.finish_push_job(j.id,j.lease_token,'expired',410);
 if exists(select 1 from push_subscriptions where id=sub and enabled) then raise exception 'Gone subscription still active';end if;
 update push_subscriptions set enabled=true where id=sub;
 select c.id into conv from player_chat_conversations c join players pl on pl.id=c.player_id where pl.profile_id=p limit 1;
 if conv is null then insert into player_chat_conversations(player_id) select id from players where profile_id=p limit 1 returning id into conv;end if;
 insert into player_chat_messages(conversation_id,sender_profile_id,body,client_key) values(conv,coach,'Private fixture message','push-fixture-'||gen_random_uuid()) returning id into msg;
 if not exists(select 1 from push_notifications where source_id=msg and profile_id=p and kind='message') then raise exception 'Leader message missing';end if;
 insert into player_chat_reads(message_id,reader_profile_id) values(msg,p);
 if exists(select 1 from push_notifications where source_id=msg and read_at is null) then raise exception 'Chat read not applied';end if;
 perform set_config('request.jwt.claim.sub',p::text,true);set local role authenticated;
 perform public.mark_push_post_read(post);
 -- First fixture post also remains unread.
 perform public.set_push_preferences(false,true);

 if (public.get_push_status()->>'unread_count')::int<>0 then raise exception 'Disabled category or chat read incorrect';end if;
 end if;
 perform set_config('request.jwt.claim.sub',p::text,true);set local role authenticated;
 perform public.disable_push_subscription('https://fcm.googleapis.com/fcm/send/kif-sql-fixture');
 reset role;
 if exists(select 1 from push_subscriptions where id=sub and enabled) then raise exception 'Disable failed';end if;
end $$;
rollback;
