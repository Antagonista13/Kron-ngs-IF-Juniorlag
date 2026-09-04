-- Juniorlag 2.0: make development notifications bidirectional.
-- Coach -> player notifications from migration 011 remain unchanged.
-- Player-owned development changes can now notify every active Admin/Coach.

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

-- Creates one unread event for each active leader. Parents are deliberately excluded.
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
    and pr.status = 'active'
  on conflict (recipient_profile_id, source_key)
    where read_at is null and source_key is not null
  do nothing;
end;
$$;

revoke all on function public.notify_leaders_of_player_development(uuid,text,text,uuid,text) from public;
grant execute on function public.notify_leaders_of_player_development(uuid,text,text,uuid,text) to authenticated;

-- Leaders may read notifications addressed to themselves just like players do.
-- Recipient-scoped RLS remains the single read rule for every role.
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
grant execute on function public.mark_development_notification_read(uuid) to authenticated;
