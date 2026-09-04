-- Juniorlag 2.0: make development notifications bidirectional.
-- Coach -> player notifications from migration 011 remain unchanged.
-- Player-owned development changes now notify every active Admin/Coach.

alter table public.development_notifications
  add column if not exists player_id uuid references public.players(id) on delete cascade,
  add column if not exists source_key text;

alter table public.development_notifications
  drop constraint if exists development_notifications_event_type_check;
alter table public.development_notifications
  add constraint development_notifications_event_type_check check (
    event_type in (
      'development_follow_up',
      'development_note',
      'goal_proposal',
      'player_goal_changed',
      'player_focus_changed',
      'player_self_assessment_changed'
    )
  );

alter table public.development_notifications
  drop constraint if exists development_notifications_entity_type_check;
alter table public.development_notifications
  add constraint development_notifications_entity_type_check check (
    entity_type in (
      'development_entry',
      'goal_proposal',
      'development_goal',
      'development_focus',
      'development_assessment'
    )
  );

create unique index if not exists development_notifications_unique_unread_source
  on public.development_notifications(recipient_profile_id, source_key)
  where read_at is null and source_key is not null;

create index if not exists development_notifications_player_unread_idx
  on public.development_notifications(player_id, created_at desc)
  where read_at is null;

create or replace function public.notify_leaders_of_player_development(
  p_player_profile_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_source_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_player_profile_id then
    raise exception 'Not authorized';
  end if;

  if public.current_profile_role() <> 'player' then
    raise exception 'Only players can create player-originated development notifications';
  end if;

  if p_event_type not in ('player_goal_changed','player_focus_changed','player_self_assessment_changed') then
    raise exception 'Invalid event type';
  end if;

  select id into v_player_id
  from public.players
  where profile_id = p_player_profile_id and is_active = true
  limit 1;

  if v_player_id is null then
    raise exception 'Active player not found';
  end if;

  insert into public.development_notifications(
    recipient_profile_id,
    event_type,
    entity_type,
    entity_id,
    player_id,
    source_key
  )
  select
    pr.id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    v_player_id,
    p_source_key
  from public.profiles pr
  where pr.role in ('admin','coach')
    and pr.is_active is true
  on conflict (recipient_profile_id, source_key)
    where read_at is null and source_key is not null
  do nothing;
end;
$$;

revoke all on function public.notify_leaders_of_player_development(uuid,text,text,uuid,text) from public;
revoke execute on function public.notify_leaders_of_player_development(uuid,text,text,uuid,text) from anon;
grant execute on function public.notify_leaders_of_player_development(uuid,text,text,uuid,text) to authenticated;

-- Recreate the player-owned goal write so the database change and notification are atomic.
create or replace function public.create_my_development_goal(
  p_title text,
  p_description text,
  p_success_description text default null
)
returns public.development_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_title text;
  v_description text;
  v_success_description text;
  v_goal public.development_goals;
begin
  if v_user_id is null then raise exception 'Du måste vara inloggad.'; end if;
  if not exists (select 1 from public.profiles where id=v_user_id and role='player' and is_active is true) then
    raise exception 'Endast spelare kan skapa mål.';
  end if;
  v_title:=btrim(p_title);v_description:=btrim(p_description);v_success_description:=nullif(btrim(p_success_description),'');
  if v_title is null or char_length(v_title)<1 then raise exception 'Målet måste ha en titel.'; end if;
  if char_length(v_title)>120 then raise exception 'Titeln får vara högst 120 tecken.'; end if;
  if v_description is null or char_length(v_description)<1 then raise exception 'Målet måste ha en beskrivning.'; end if;
  if char_length(v_description)>2000 then raise exception 'Beskrivningen får vara högst 2000 tecken.'; end if;
  if v_success_description is not null and char_length(v_success_description)>1000 then raise exception 'Texten om hur du märker utveckling får vara högst 1000 tecken.'; end if;
  insert into public.development_goals(player_id,title,description,success_description,status)
  values(v_user_id,v_title,v_description,v_success_description,'active') returning * into v_goal;
  perform public.notify_leaders_of_player_development(v_user_id,'player_goal_changed','development_goal',v_goal.id,'goal:'||v_goal.id::text);
  return v_goal;
exception when unique_violation then raise exception 'Du har redan ett aktivt mål.';
end;
$$;
revoke all on function public.create_my_development_goal(text,text,text) from public;
revoke execute on function public.create_my_development_goal(text,text,text) from anon;
grant execute on function public.create_my_development_goal(text,text,text) to authenticated;

-- Recreate the player-owned focus write so the database change and notification are atomic.
create or replace function public.create_my_development_focus(
  p_development_area text,
  p_focus_text text,
  p_attention_text text default null
)
returns public.development_focuses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_area text;
  v_focus_text text;
  v_attention_text text;
  v_focus public.development_focuses;
begin
  if v_user_id is null then raise exception 'Du måste vara inloggad.'; end if;
  if not exists (select 1 from public.profiles where id=v_user_id and role='player' and is_active is true) then raise exception 'Endast spelare kan skapa fokus.'; end if;
  v_area:=btrim(p_development_area);v_focus_text:=btrim(p_focus_text);v_attention_text:=nullif(btrim(p_attention_text),'');
  if v_area not in ('technique','game_understanding','physical','mentality') then raise exception 'Ogiltigt utvecklingsområde.'; end if;
  if v_focus_text is null or char_length(v_focus_text)<1 then raise exception 'Fokus måste innehålla text.'; end if;
  if char_length(v_focus_text)>160 then raise exception 'Fokustexten får vara högst 160 tecken.'; end if;
  if v_attention_text is not null and char_length(v_attention_text)>1000 then raise exception 'Texten om vad du ska tänka på får vara högst 1000 tecken.'; end if;
  insert into public.development_focuses(player_id,development_area,focus_text,attention_text,lifecycle_status,follow_up_status)
  values(v_user_id,v_area,v_focus_text,v_attention_text,'active','active') returning * into v_focus;
  perform public.notify_leaders_of_player_development(v_user_id,'player_focus_changed','development_focus',v_focus.id,'focus:'||v_focus.id::text);
  return v_focus;
exception when unique_violation then raise exception 'Du har redan ett aktivt fokus.';
end;
$$;
revoke all on function public.create_my_development_focus(text,text,text) from public;
revoke execute on function public.create_my_development_focus(text,text,text) from anon;
grant execute on function public.create_my_development_focus(text,text,text) to authenticated;

-- Self-assessment IDs are bigint; the notification points at the player's assessment section
-- while source_key keeps the exact assessment version unique.
create or replace function public.save_player_self_assessment(
  p_technique_self integer,
  p_technique_reflection text,
  p_game_understanding_self integer,
  p_game_understanding_reflection text,
  p_physical_self integer,
  p_physical_reflection text,
  p_mentality_self integer,
  p_mentality_reflection text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_assessment_id bigint;
  v_player_id uuid;
begin
  if v_user_id is null then raise exception 'Du måste vara inloggad.'; end if;
  if public.current_profile_role() <> 'player' then raise exception 'Endast spelare kan spara självskattning.'; end if;
  select id into v_player_id from public.players where profile_id=v_user_id and is_active=true limit 1;
  if v_player_id is null then raise exception 'Aktiv spelarpost saknas.'; end if;
  insert into public.development_assessments(
    player_id,technique_self,technique_reflection,game_understanding_self,game_understanding_reflection,
    physical_self,physical_reflection,mentality_self,mentality_reflection
  ) values (
    v_user_id,p_technique_self,p_technique_reflection,p_game_understanding_self,p_game_understanding_reflection,
    p_physical_self,p_physical_reflection,p_mentality_self,p_mentality_reflection
  ) returning id into v_assessment_id;
  perform public.notify_leaders_of_player_development(v_user_id,'player_self_assessment_changed','development_assessment',v_player_id,'assessment:'||v_assessment_id::text);
end;
$$;
revoke all on function public.save_player_self_assessment(integer,text,integer,text,integer,text,integer,text) from public;
revoke execute on function public.save_player_self_assessment(integer,text,integer,text,integer,text,integer,text) from anon;
grant execute on function public.save_player_self_assessment(integer,text,integer,text,integer,text,integer,text) to authenticated;

-- Recipient-scoped read access for every role.
drop policy if exists "players read own development notifications" on public.development_notifications;
drop policy if exists "recipients read own development notifications" on public.development_notifications;
create policy "recipients read own development notifications"
  on public.development_notifications
  for select to authenticated
  using (recipient_profile_id = auth.uid());

create or replace function public.mark_development_notification_read(p_notification_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.development_notifications set read_at=now()
  where id=p_notification_id and recipient_profile_id = auth.uid() and read_at is null;
$$;
revoke all on function public.mark_development_notification_read(uuid) from public;
revoke execute on function public.mark_development_notification_read(uuid) from anon;
grant execute on function public.mark_development_notification_read(uuid) to authenticated;
