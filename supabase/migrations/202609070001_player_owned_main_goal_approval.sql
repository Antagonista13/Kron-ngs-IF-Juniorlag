-- Player-owned main goal approval workflow.
-- development_goals remains the canonical goal record.

alter table public.development_goals
  drop constraint if exists development_goals_status_check;

alter table public.development_goals
  add constraint development_goals_status_check
  check (status in ('draft','pending_review','active','completed','replaced'));

alter table public.development_goals
  add column if not exists review_status text not null default 'approved'
    check (review_status in ('draft','pending_review','approved','returned')),
  add column if not exists coach_comment text,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_profile_id uuid references public.profiles(id),
  add column if not exists approved_at timestamptz;

update public.development_goals
set review_status = 'approved',
    approved_at = coalesce(approved_at, created_at)
where status = 'active'
  and review_status <> 'approved';

create unique index if not exists development_goals_one_open_review_per_player
on public.development_goals(player_id)
where status in ('draft','pending_review');

create or replace function public.save_my_main_goal_draft(
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
  v_goal public.development_goals;
  v_title text := btrim(coalesce(p_title,''));
  v_description text := btrim(coalesce(p_description,''));
  v_success_description text := nullif(btrim(coalesce(p_success_description,'')), '');
begin
  if v_user_id is null or public.current_profile_role() <> 'player' then
    raise exception 'Not authorized';
  end if;
  if length(v_title) < 1 then raise exception 'Goal title is required'; end if;
  if length(v_title) > 120 then raise exception 'Goal title is too long'; end if;
  if length(v_description) < 1 then raise exception 'Goal description is required'; end if;
  if length(v_description) > 2000 then raise exception 'Goal description is too long'; end if;
  if v_success_description is not null and length(v_success_description) > 1000 then
    raise exception 'Success description is too long';
  end if;

  select * into v_goal
  from public.development_goals
  where player_id = v_user_id
    and status in ('draft','pending_review')
  order by created_at desc
  limit 1
  for update;

  if found and v_goal.status = 'pending_review' then
    raise exception 'Goal is waiting for coach review';
  end if;

  if found then
    update public.development_goals
    set title = v_title,
        description = v_description,
        success_description = v_success_description,
        review_status = 'draft',
        coach_comment = null,
        reviewed_at = null,
        reviewed_by_profile_id = null,
        updated_at = now()
    where id = v_goal.id
    returning * into v_goal;
  else
    insert into public.development_goals(
      player_id,title,description,success_description,status,review_status
    ) values (
      v_user_id,v_title,v_description,v_success_description,'draft','draft'
    ) returning * into v_goal;
  end if;

  return v_goal;
end;
$$;

create or replace function public.submit_my_main_goal_for_review(p_goal_id uuid)
returns public.development_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal public.development_goals;
begin
  if auth.uid() is null or public.current_profile_role() <> 'player' then
    raise exception 'Not authorized';
  end if;

  select * into v_goal
  from public.development_goals
  where id = p_goal_id
    and player_id = auth.uid()
  for update;

  if not found then raise exception 'Goal not found'; end if;
  if v_goal.status <> 'draft' then raise exception 'Goal is not a draft'; end if;

  update public.development_goals
  set status = 'pending_review',
      review_status = 'pending_review',
      submitted_at = now(),
      coach_comment = null,
      reviewed_at = null,
      reviewed_by_profile_id = null,
      updated_at = now()
  where id = p_goal_id
  returning * into v_goal;

  return v_goal;
end;
$$;

create or replace function public.leader_review_player_main_goal(
  p_goal_id uuid,
  p_decision text,
  p_comment text default null
)
returns public.development_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal public.development_goals;
  v_comment text := nullif(btrim(coalesce(p_comment,'')), '');
begin
  if not public.is_leader() then raise exception 'Not authorized'; end if;
  if p_decision not in ('approved','returned') then raise exception 'Invalid decision'; end if;

  select * into v_goal
  from public.development_goals
  where id = p_goal_id
  for update;

  if not found then raise exception 'Goal not found'; end if;
  if v_goal.status <> 'pending_review' then raise exception 'Goal is not waiting for review'; end if;

  if p_decision = 'approved' then
    update public.development_goals
    set status = 'replaced', updated_at = now()
    where player_id = v_goal.player_id
      and id <> v_goal.id
      and status = 'active';

    update public.development_goals
    set status = 'active',
        review_status = 'approved',
        coach_comment = v_comment,
        reviewed_at = now(),
        reviewed_by_profile_id = auth.uid(),
        approved_at = now(),
        updated_at = now()
    where id = v_goal.id
    returning * into v_goal;
  else
    update public.development_goals
    set status = 'draft',
        review_status = 'returned',
        coach_comment = v_comment,
        reviewed_at = now(),
        reviewed_by_profile_id = auth.uid(),
        updated_at = now()
    where id = v_goal.id
    returning * into v_goal;
  end if;

  return v_goal;
end;
$$;

revoke all on function public.save_my_main_goal_draft(text,text,text) from public;
revoke all on function public.submit_my_main_goal_for_review(uuid) from public;
revoke all on function public.leader_review_player_main_goal(uuid,text,text) from public;

grant execute on function public.save_my_main_goal_draft(text,text,text) to authenticated;
grant execute on function public.submit_my_main_goal_for_review(uuid) to authenticated;
grant execute on function public.leader_review_player_main_goal(uuid,text,text) to authenticated;
