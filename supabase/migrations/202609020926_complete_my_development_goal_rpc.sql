create or replace function public.complete_my_development_goal(
  p_goal_id uuid,
  p_final_reflection text
)
returns public.development_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reflection text;
  v_goal public.development_goals;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Du måste vara inloggad.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_user_id
      and p.role = 'player'
  ) then
    raise exception 'Endast spelare kan avsluta sitt mål.';
  end if;

  v_reflection := btrim(p_final_reflection);

  if v_reflection is null or char_length(v_reflection) < 1 then
    raise exception 'Du måste skriva en slutreflektion.';
  end if;

  if char_length(v_reflection) > 2000 then
    raise exception 'Slutreflektionen får vara högst 2000 tecken.';
  end if;

  update public.development_goals
  set
    status = 'completed',
    final_reflection = v_reflection,
    completed_at = now(),
    updated_at = now()
  where id = p_goal_id
    and player_id = v_user_id
    and status = 'active'
  returning *
  into v_goal;

  if v_goal.id is null then
    raise exception 'Aktivt mål kunde inte hittas.';
  end if;

  return v_goal;
end;
$$;

revoke execute
on function public.complete_my_development_goal(uuid, text)
from public;

grant execute
on function public.complete_my_development_goal(uuid, text)
to authenticated;
