create or replace function public.add_coach_focus_comment(p_focus_id uuid, p_comment text)
returns public.development_focus_coach_feedback
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_comment text := btrim(p_comment);
  v_row public.development_focus_coach_feedback;
  v_player_profile_id uuid;
  v_player_id uuid;
begin
  if auth.uid() is null or not public.is_coach() then
    raise exception 'Endast tränare kan lämna återkoppling.';
  end if;

  if v_comment is null
     or char_length(v_comment) < 1
     or char_length(v_comment) > 2000 then
    raise exception 'Kommentaren måste vara mellan 1 och 2000 tecken.';
  end if;

  select f.player_id
    into v_player_profile_id
  from public.development_focuses f
  join public.profiles player_profile
    on player_profile.id = f.player_id
  join public.profiles coach_profile
    on coach_profile.id = auth.uid()
  where f.id = p_focus_id
    and f.lifecycle_status = 'active'
    and coach_profile.team = player_profile.team
  limit 1;

  if v_player_profile_id is null then
    raise exception 'Aktivt fokus kunde inte hittas.';
  end if;

  insert into public.development_focus_coach_feedback (
    focus_id,
    coach_id,
    comment
  )
  values (
    p_focus_id,
    auth.uid(),
    v_comment
  )
  returning *
  into v_row;

  select p.id
    into v_player_id
  from public.players p
  where p.profile_id = v_player_profile_id
    and p.is_active = true
  limit 1;

  insert into public.development_notifications (
    recipient_profile_id,
    event_type,
    entity_type,
    entity_id,
    player_id,
    source_key
  )
  values (
    v_player_profile_id,
    'coach_focus_feedback',
    'development_focus',
    p_focus_id,
    v_player_id,
    'coach_focus_feedback:' || p_focus_id::text
  )
  on conflict (recipient_profile_id, source_key)
    where read_at is null and source_key is not null
  do nothing;

  return v_row;
end;
$function$;


revoke execute on function public.add_coach_focus_comment(uuid, text) from public, anon;
grant execute on function public.add_coach_focus_comment(uuid, text) to authenticated;
