create or replace function public.set_my_goal_subgoal_completed(
  p_subgoal_id uuid,
  p_completed boolean
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
    status = case
      when p_completed then 'completed'
      else 'active'
    end,
    completed_at = case
      when p_completed then now()
      else null
    end
  where id = p_subgoal_id
  returning *
  into v_subgoal;

  return v_subgoal;
end;
$$;

revoke execute
on function public.set_my_goal_subgoal_completed(uuid, boolean)
from public;

grant execute
on function public.set_my_goal_subgoal_completed(uuid, boolean)
to authenticated;
