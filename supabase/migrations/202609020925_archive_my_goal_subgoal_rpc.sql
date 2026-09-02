create or replace function public.archive_my_goal_subgoal(
  p_subgoal_id uuid
)
returns public.development_subgoals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_subgoal public.development_subgoals;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Du måste vara inloggad.';
  end if;

  if not exists (
    select 1
    from public.development_subgoals sg
    join public.development_goals g
      on g.id = sg.goal_id
    where sg.id = p_subgoal_id
      and g.player_id = v_user_id
      and g.status = 'active'
      and sg.status <> 'archived'
  ) then
    raise exception 'Delmålet kunde inte hittas.';
  end if;

  update public.development_subgoals
  set
    status = 'archived',
    archived_at = now()
  where id = p_subgoal_id
  returning *
  into v_subgoal;

  return v_subgoal;
end;
$$;

revoke execute
on function public.archive_my_goal_subgoal(uuid)
from public;

grant execute
on function public.archive_my_goal_subgoal(uuid)
to authenticated;
