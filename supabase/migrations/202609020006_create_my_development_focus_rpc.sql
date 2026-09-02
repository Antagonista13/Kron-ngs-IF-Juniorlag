-- Secure RPC for creating the signed-in player's first active development focus.

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
  v_user_id uuid;
  v_area text;
  v_focus_text text;
  v_attention_text text;
  v_focus public.development_focuses;
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
    raise exception 'Endast spelare kan skapa fokus.';
  end if;

  v_area := btrim(p_development_area);
  v_focus_text := btrim(p_focus_text);
  v_attention_text := nullif(btrim(p_attention_text), '');

  if v_area not in (
    'technique',
    'game_understanding',
    'physical',
    'mentality'
  ) then
    raise exception 'Ogiltigt utvecklingsområde.';
  end if;

  if v_focus_text is null or char_length(v_focus_text) < 1 then
    raise exception 'Fokus måste innehålla text.';
  end if;

  if char_length(v_focus_text) > 160 then
    raise exception 'Fokustexten får vara högst 160 tecken.';
  end if;

  if v_attention_text is not null
     and char_length(v_attention_text) > 1000 then
    raise exception 'Texten om vad du ska tänka på får vara högst 1000 tecken.';
  end if;

  insert into public.development_focuses (
    player_id,
    development_area,
    focus_text,
    attention_text,
    lifecycle_status,
    follow_up_status
  )
  values (
    v_user_id,
    v_area,
    v_focus_text,
    v_attention_text,
    'active',
    'active'
  )
  returning *
  into v_focus;

  return v_focus;

exception
  when unique_violation then
    raise exception 'Du har redan ett aktivt fokus.';
end;
$$;

revoke execute
on function public.create_my_development_focus(text, text, text)
from public;

grant execute
on function public.create_my_development_focus(text, text, text)
to authenticated;