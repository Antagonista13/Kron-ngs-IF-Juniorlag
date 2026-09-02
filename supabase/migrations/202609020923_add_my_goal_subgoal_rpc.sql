create or replace function public.add_my_goal_subgoal(
  p_goal_id uuid,
  p_text text
)
returns public.development_subgoals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_text text;
  v_sort_order integer;
  v_subgoal public.development_subgoals;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Du måste vara inloggad.';
  end if;

  if not exists (
    select 1
    from public.development_goals
    where id = p_goal_id
      and player_id = v_user_id
      and status = 'active'
  ) then
    raise exception 'Aktivt mål kunde inte hittas.';
  end if;

  v_text := btrim(p_text);

  if v_text is null or char_length(v_text) < 1 then
    raise exception 'Delmålet måste innehålla text.';
  end if;

  if char_length(v_text) > 300 then
    raise exception 'Delmålet får vara högst 300 tecken.';
  end if;

  select coalesce(max(sort_order), -1) + 1
  into v_sort_order
  from public.development_subgoals
  where goal_id = p_goal_id
    and status <> 'archived';

  insert into public.development_subgoals (
    goal_id,
    text,
    sort_order,
    status
  )
  values (
    p_goal_id,
    v_text,
    v_sort_order,
    'active'
  )
  returning *
  into v_subgoal;

  return v_subgoal;
end;
$$;

revoke execute
on function public.add_my_goal_subgoal(uuid, text)
from public;

grant execute
on function public.add_my_goal_subgoal(uuid, text)
to authenticated;
