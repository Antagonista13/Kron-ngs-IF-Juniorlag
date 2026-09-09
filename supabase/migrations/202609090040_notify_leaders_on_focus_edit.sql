-- Notify active leaders whenever a player edits their active focus.

create or replace function public.update_my_active_development_focus(
  p_focus_id uuid,
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
  v_user_id uuid := auth.uid();
  v_area text;
  v_focus_text text;
  v_attention_text text;
  v_focus public.development_focuses;
begin
  if v_user_id is null then raise exception 'Du måste vara inloggad.'; end if;
  if not exists (select 1 from public.profiles where id=v_user_id and role='player' and is_active is true) then
    raise exception 'Endast spelare kan ändra fokus.';
  end if;

  v_area:=btrim(p_development_area);
  v_focus_text:=btrim(p_focus_text);
  v_attention_text:=nullif(btrim(p_attention_text),'');

  if v_area not in ('technique','game_understanding','physical','mentality') then raise exception 'Ogiltigt utvecklingsområde.'; end if;
  if v_focus_text is null or char_length(v_focus_text)<1 then raise exception 'Fokus måste innehålla text.'; end if;
  if char_length(v_focus_text)>160 then raise exception 'Fokustexten får vara högst 160 tecken.'; end if;
  if v_attention_text is not null and char_length(v_attention_text)>1000 then raise exception 'Texten om vad du ska tänka på får vara högst 1000 tecken.'; end if;

  update public.development_focuses
  set development_area=v_area,
      focus_text=v_focus_text,
      attention_text=v_attention_text
  where id=p_focus_id
    and player_id=v_user_id
    and lifecycle_status='active'
  returning * into v_focus;

  if v_focus.id is null then raise exception 'Aktivt fokus hittades inte.'; end if;

  perform public.notify_leaders_of_player_development(
    v_user_id,
    'player_focus_changed',
    'development_focus',
    v_focus.id,
    'focus-edit:' || v_focus.id::text || ':' || clock_timestamp()::text
  );

  return v_focus;
end;
$$;

revoke all on function public.update_my_active_development_focus(uuid,text,text,text) from public;
revoke execute on function public.update_my_active_development_focus(uuid,text,text,text) from anon;
grant execute on function public.update_my_active_development_focus(uuid,text,text,text) to authenticated;
