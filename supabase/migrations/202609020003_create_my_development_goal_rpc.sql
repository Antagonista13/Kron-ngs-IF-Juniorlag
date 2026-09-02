-- Secure RPC for creating the signed-in player's first active development goal.

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
  v_user_id uuid;
  v_title text;
  v_description text;
  v_success_description text;
  v_goal public.development_goals;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Du måste vara inloggad.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and role = 'player'
  ) then
    raise exception 'Endast spelare kan skapa mål.';
  end if;

  v_title := btrim(p_title);
  v_description := btrim(p_description);
  v_success_description := nullif(btrim(p_success_description), '');

  if v_title is null or char_length(v_title) < 1 then
    raise exception 'Målet måste ha en titel.';
  end if;

  if char_length(v_title) > 120 then
    raise exception 'Titeln får vara högst 120 tecken.';
  end if;

  if v_description is null or char_length(v_description) < 1 then
    raise exception 'Målet måste ha en beskrivning.';
  end if;

  if char_length(v_description) > 2000 then
    raise exception 'Beskrivningen får vara högst 2000 tecken.';
  end if;

  if v_success_description is not null
     and char_length(v_success_description) > 1000 then
    raise exception 'Texten om hur du märker utveckling får vara högst 1000 tecken.';
  end if;

  insert into public.development_goals (
    player_id,
    title,
    description,
    success_description,
    status
  )
  values (
    v_user_id,
    v_title,
    v_description,
    v_success_description,
    'active'
  )
  returning *
  into v_goal;

  return v_goal;

exception
  when unique_violation then
    raise exception 'Du har redan ett aktivt mål.';
end;
$$;

revoke execute
on function public.create_my_development_goal(text, text, text)
from public;

grant execute
on function public.create_my_development_goal(text, text, text)
to authenticated;
