-- Secure RPC for letting the signed-in player close an active focus
-- after the coach has marked the follow-up as complete.

create or replace function public.complete_my_development_focus(
  p_focus_id uuid,
  p_end_reflection text
)
returns public.development_focuses
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_reflection text;
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
    raise exception 'Endast spelare kan avsluta sitt fokus.';
  end if;

  v_reflection := btrim(p_end_reflection);

  if v_reflection is null or char_length(v_reflection) < 1 then
    raise exception 'Skriv en kort reflektion innan du avslutar fokuset.';
  end if;

  if char_length(v_reflection) > 2000 then
    raise exception 'Reflektionen får vara högst 2000 tecken.';
  end if;

  update public.development_focuses
  set
    lifecycle_status = 'ended',
    player_reflection = v_reflection,
    ended_at = now(),
    updated_at = now()
  where id = p_focus_id
    and player_id = v_user_id
    and lifecycle_status = 'active'
    and follow_up_status = 'follow_up_complete'
  returning * into v_focus;

  if v_focus.id is null then
    raise exception 'Fokuset kunde inte avslutas. Kontrollera att uppföljningen är klar.';
  end if;

  return v_focus;
end;
$$;

revoke execute
on function public.complete_my_development_focus(uuid, text)
from public;

grant execute
on function public.complete_my_development_focus(uuid, text)
to authenticated;
