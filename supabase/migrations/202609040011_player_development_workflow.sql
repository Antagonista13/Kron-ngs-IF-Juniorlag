-- Player development workflow. Workflow entities use players.id as the stable roster id.
-- Existing development_goals remains profile-based; accepted proposals bridge via players.profile_id.

create table if not exists public.development_entries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id),
  entry_type text not null check (entry_type in ('follow_up','note')),
  visibility text not null check (visibility in ('player_visible','leaders_only')),
  comment text not null check (length(btrim(comment)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.development_goal_proposals (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  proposed_by_profile_id uuid not null references public.profiles(id),
  proposed_goal_text text not null check (length(btrim(proposed_goal_text)) > 0),
  coach_comment text,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index if not exists one_pending_goal_proposal_per_player
  on public.development_goal_proposals(player_id) where status = 'pending';

create table if not exists public.development_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('development_follow_up','development_note','goal_proposal')),
  entity_type text not null check (entity_type in ('development_entry','goal_proposal')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists development_entries_player_created_idx on public.development_entries(player_id, created_at desc);
create index if not exists development_notifications_recipient_unread_idx on public.development_notifications(recipient_profile_id, created_at desc) where read_at is null;

alter table public.development_entries enable row level security;
alter table public.development_goal_proposals enable row level security;
alter table public.development_notifications enable row level security;

drop policy if exists "leaders read development entries" on public.development_entries;
create policy "leaders read development entries" on public.development_entries for select to authenticated using (public.is_leader());
drop policy if exists "players read visible own development entries" on public.development_entries;
create policy "players read visible own development entries" on public.development_entries for select to authenticated using (
  visibility = 'player_visible' and exists (select 1 from public.players p where p.id = player_id and p.profile_id = auth.uid())
);

drop policy if exists "leaders read goal proposals" on public.development_goal_proposals;
create policy "leaders read goal proposals" on public.development_goal_proposals for select to authenticated using (public.is_leader());
drop policy if exists "players read own goal proposals" on public.development_goal_proposals;
create policy "players read own goal proposals" on public.development_goal_proposals for select to authenticated using (
  exists (select 1 from public.players p where p.id = player_id and p.profile_id = auth.uid())
);

drop policy if exists "players read own development notifications" on public.development_notifications;
create policy "players read own development notifications" on public.development_notifications for select to authenticated using (recipient_profile_id = auth.uid());

create or replace function public.leader_create_development_entry(p_player_id uuid, p_comment text, p_visibility text, p_entry_type text default 'follow_up')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_entry_id uuid; v_recipient uuid;
begin
  if not public.is_leader() then raise exception 'Not authorized'; end if;
  if p_entry_type not in ('follow_up','note') then raise exception 'Invalid entry type'; end if;
  if p_visibility not in ('player_visible','leaders_only') then raise exception 'Invalid visibility'; end if;
  if p_comment is null or length(btrim(p_comment)) = 0 then raise exception 'Comment is required'; end if;
  select profile_id into v_recipient from public.players where id = p_player_id and is_active = true;
  if not found then raise exception 'Player not found'; end if;
  insert into public.development_entries(player_id, author_profile_id, entry_type, visibility, comment)
    values (p_player_id, auth.uid(), p_entry_type, p_visibility, btrim(p_comment)) returning id into v_entry_id;
  if p_visibility = 'player_visible' and v_recipient is not null then
    insert into public.development_notifications(recipient_profile_id,event_type,entity_type,entity_id)
      values (v_recipient, case when p_entry_type='follow_up' then 'development_follow_up' else 'development_note' end, 'development_entry', v_entry_id);
  end if;
  return v_entry_id;
end; $$;

create or replace function public.leader_propose_development_goal(p_player_id uuid, p_goal_text text, p_comment text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_recipient uuid;
begin
  if not public.is_leader() then raise exception 'Not authorized'; end if;
  if p_goal_text is null or length(btrim(p_goal_text)) = 0 then raise exception 'Goal is required'; end if;
  select profile_id into v_recipient from public.players where id = p_player_id and is_active = true;
  if not found then raise exception 'Player not found'; end if;
  insert into public.development_goal_proposals(player_id,proposed_by_profile_id,proposed_goal_text,coach_comment)
    values(p_player_id,auth.uid(),btrim(p_goal_text),nullif(btrim(coalesce(p_comment,'')),'')) returning id into v_id;
  if v_recipient is not null then
    insert into public.development_notifications(recipient_profile_id,event_type,entity_type,entity_id)
      values(v_recipient,'goal_proposal','goal_proposal',v_id);
  end if;
  return v_id;
end; $$;

create or replace function public.player_respond_goal_proposal(p_proposal_id uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare v_proposal public.development_goal_proposals%rowtype; v_profile_id uuid;
begin
  if public.current_profile_role() <> 'player' then raise exception 'Not authorized'; end if;
  if p_decision not in ('accepted','rejected') then raise exception 'Invalid decision'; end if;
  select gp.* into v_proposal from public.development_goal_proposals gp
    join public.players p on p.id=gp.player_id
    where gp.id=p_proposal_id and p.profile_id=auth.uid() for update of gp;
  if not found then raise exception 'Proposal not found'; end if;
  if v_proposal.status <> 'pending' then raise exception 'Proposal already resolved'; end if;
  select profile_id into v_profile_id from public.players where id=v_proposal.player_id;
  if p_decision='accepted' then
    update public.development_goals set status = 'replaced' where player_id=v_profile_id and status='active';
    insert into public.development_goals(player_id,title,description,status)
      values(v_profile_id,v_proposal.proposed_goal_text,v_proposal.proposed_goal_text,'active');
  end if;
  update public.development_goal_proposals set status=p_decision,resolved_at=now() where id=p_proposal_id;
  update public.development_notifications set read_at=coalesce(read_at,now())
    where recipient_profile_id=auth.uid() and entity_type='goal_proposal' and entity_id=p_proposal_id;
end; $$;

create or replace function public.mark_development_notification_read(p_notification_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.development_notifications set read_at=now()
  where id=p_notification_id and recipient_profile_id=auth.uid() and read_at is null;
$$;

revoke all on function public.leader_create_development_entry(uuid,text,text,text) from public;
revoke all on function public.leader_propose_development_goal(uuid,text,text) from public;
revoke all on function public.player_respond_goal_proposal(uuid,text) from public;
revoke all on function public.mark_development_notification_read(uuid) from public;
grant execute on function public.leader_create_development_entry(uuid,text,text,text) to authenticated;
grant execute on function public.leader_propose_development_goal(uuid,text,text) to authenticated;
grant execute on function public.player_respond_goal_proposal(uuid,text) to authenticated;
grant execute on function public.mark_development_notification_read(uuid) to authenticated;
