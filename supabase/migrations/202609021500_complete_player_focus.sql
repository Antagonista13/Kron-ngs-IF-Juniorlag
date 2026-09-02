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
  v_focus public.development_focuses;
  v_reflection text := btrim(coalesce(p_end_reflection, ''));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if v_reflection = '' then
    raise exception 'Reflection is required';
  end if;

  select * into v_focus
  from public.development_focuses
  where id = p_focus_id
    and player_id = auth.uid()
    and lifecycle_status = 'active'
  for update;

  if not found then
    raise exception 'Active focus not found';
  end if;

  if v_focus.follow_up_status <> 'follow_up_complete' then
    raise exception 'Coach follow-up must be complete before focus can be ended';
  end if;

  update public.development_focuses
  set lifecycle_status = 'completed',
      end_reflection = v_reflection,
      ended_at = now(),
      updated_at = now()
  where id = p_focus_id
  returning * into v_focus;

  return v_focus;
end;
$$;

revoke all on function public.complete_my_development_focus(uuid, text) from public;
grant execute on function public.complete_my_development_focus(uuid, text) to authenticated;