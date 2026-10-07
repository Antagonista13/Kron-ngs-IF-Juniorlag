begin;
do $$
declare p uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); off uuid:=gen_random_uuid(); inactive uuid:=gen_random_uuid(); parent uuid:=gen_random_uuid(); player uuid; conv uuid; msg uuid; reply uuid; sub_a uuid; sub_b uuid; visible int; j record;
begin
 insert into profiles(id,role,team,is_active,full_name) values
 (p,'player','Leader fixture',true,'Player'),(a,'admin','Leader fixture',true,'Admin'),(b,'coach','Leader fixture',true,'Coach'),
 (outsider,'coach','Other fixture',true,'Other'),(off,'coach','Leader fixture',true,'Opted out'),(inactive,'coach','Leader fixture',false,'Inactive'),(parent,'parent','Leader fixture',true,'Parent');
 insert into players(profile_id,is_active) values(p,true) returning id into player;
 insert into player_chat_conversations(player_id) values(player) returning id into conv;
 perform set_config('request.jwt.claim.sub',a::text,true);set local role authenticated;
 sub_a:=register_push_subscription('https://fcm.googleapis.com/fcm/send/leader-a-fixture',repeat('A',87),repeat('B',22));
 perform set_push_preferences(true,true);
 if (get_push_status()->>'posts_enabled')::boolean then raise exception 'Leader post category enabled';end if;
 if (get_push_status()->>'delivery_enabled')::boolean then raise exception 'Leader rollout prematurely enabled';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 sub_b:=register_push_subscription('https://fcm.googleapis.com/fcm/send/leader-b-fixture',repeat('A',87),repeat('B',22));perform set_push_preferences(false,true);
 select count(*) into visible from push_preferences where profile_id=a;
 if visible<>0 then raise exception 'Leader sees another leaders preferences';end if;
 perform set_config('request.jwt.claim.sub',parent::text,true);
 begin perform get_push_status();raise exception 'Parent allowed';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',inactive::text,true);
 begin perform set_push_preferences(false,true);raise exception 'Inactive leader allowed';exception when insufficient_privilege then null;end;
 reset role;
 insert into push_preferences(profile_id,messages_enabled) values(outsider,true),(off,false),(inactive,true);
 insert into push_subscriptions(profile_id,endpoint,p256dh,auth) values(outsider,'https://fcm.googleapis.com/fcm/send/other-fixture',repeat('A',87),repeat('B',22));
 insert into player_chat_messages(conversation_id,sender_profile_id,body,client_key) values(conv,p,'Private player reply','leader-test-disabled') returning id into msg;
 if (select count(*) from push_notifications where source_id=msg)<>2 then raise exception 'Opt-in same-team leader fanout incorrect';end if;
 if exists(select 1 from push_delivery_jobs job join push_notifications n on n.id=job.notification_id where n.source_id=msg) then raise exception 'Disabled rollout enqueued jobs';end if;
 update push_config set leader_delivery_enabled=true where singleton;
 if (select delivery_enabled from push_config) then raise exception 'Player rollout changed';end if;
 insert into player_chat_messages(conversation_id,sender_profile_id,body,client_key) values(conv,p,'New message','leader-test-enabled') returning id into msg;
 if (select count(*) from push_delivery_jobs job join push_notifications n on n.id=job.notification_id where n.source_id=msg)<>2 then raise exception 'Leader jobs missing';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);set local role authenticated;
 if (get_push_status()->>'unread_count')::int<>2 then raise exception 'Admin unread missing';end if;
 reset role;
 insert into player_chat_reads(message_id,reader_profile_id) select source_id,a from push_notifications where profile_id=a and kind='message';
 perform set_config('request.jwt.claim.sub',a::text,true);
 if (get_push_status()->>'unread_count')::int<>0 then raise exception 'Admin read not cleared';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 if (get_push_status()->>'unread_count')::int<>2 then raise exception 'Admin cleared coach unread';end if;
 if exists(select 1 from push_notifications where profile_id=b and read_at is not null) then raise exception 'Coach receipt altered';end if;
 -- A staff reply notifies only the player, retaining the other leader's unread count.
 perform set_config('request.jwt.claim.sub',p::text,true);perform set_push_preferences(true,true);
 insert into player_chat_messages(conversation_id,sender_profile_id,body,client_key) values(conv,a,'Staff reply','leader-test-staff') returning id into reply;
 if (select count(*) from push_notifications where source_id=reply)<>1 or not exists(select 1 from push_notifications where source_id=reply and profile_id=p) then raise exception 'Staff reply notified leaders';end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 if (get_push_status()->>'unread_count')::int<>2 then raise exception 'Staff reply cleared coach unread';end if;
 -- Turning on after an older event must not create a backlog.
 update push_preferences set messages_enabled=true,messages_enabled_at=now()+interval '1 hour' where profile_id=off;
 insert into player_chat_messages(conversation_id,sender_profile_id,body,client_key) values(conv,p,'Older than opt-in','leader-test-before-optin') returning id into reply;
 if exists(select 1 from push_notifications where profile_id=off and source_id=reply) then raise exception 'Pre-opt-in message notified';end if;
 -- Preserve the original staff-reply id used below.
 select id into reply from player_chat_messages where client_key='leader-test-staff';
 -- Current authorization and independent receipt are revalidated at delivery.
 select x.* into j from claim_push_jobs(100) x join push_notifications n on n.id=x.notification_id where n.profile_id=b and n.source_id=msg;
 if get_push_delivery(j.id,j.lease_token) is null then raise exception 'Unread coach delivery missing';end if;
 update profiles set team='Other fixture' where id=b;
 if get_push_delivery(j.id,j.lease_token) is not null then raise exception 'Leader team change ignored';end if;
 update profiles set team='Leader fixture',is_active=false where id=b;
 if get_push_delivery(j.id,j.lease_token) is not null then raise exception 'Inactive leader delivery allowed';end if;
 update profiles set is_active=true,role='parent' where id=b;
 if get_push_delivery(j.id,j.lease_token) is not null then raise exception 'Leader role change ignored';end if;
 update profiles set role='coach' where id=b;update players set is_active=false where id=player;
 if get_push_delivery(j.id,j.lease_token) is not null then raise exception 'Inactive player delivery allowed';end if;
 update players set is_active=true where id=player;
 insert into player_chat_reads(message_id,reader_profile_id) values(msg,b);
 if get_push_delivery(j.id,j.lease_token) is not null then raise exception 'Coach read delivery allowed';end if;
 if not exists(select 1 from push_notifications where profile_id=p and source_id=reply and read_at is null) then raise exception 'Coach cleared players unread';end if;
end $$;
rollback;
