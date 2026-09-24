-- Admin removal from Laget archives the player, disables linked app access,
-- preserves history and marks the SportAdmin presence row as intentionally kept
-- so a still-present SportAdmin player is not immediately re-imported/reactivated.

create or replace function public.admin_archive_player(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if auth.uid() is null
     or not public.current_profile_active()
     or public.current_profile_role() <> 'admin' then
    raise exception 'Only an active admin can remove a player from the app';
  end if;

  select profile_id into v_profile_id
  from public.players
  where id = p_player_id and is_active = true
  for update;

  if not found then
    raise exception 'Player was not found or is already removed';
  end if;

  update public.players
  set is_active = false, updated_at = now()
  where id = p_player_id;

  if v_profile_id is not null then
    update public.profiles
    set is_active = false, access_updated_at = now()
    where id = v_profile_id and role <> 'admin';
  end if;

  insert into public.sportadmin_player_presence(player_id, normalized_name, state, updated_at)
  select p.id, lower(btrim(p.full_name)), 'kept', now()
  from public.players p
  where p.id = p_player_id
  on conflict (player_id) do update
  set state = 'kept', updated_at = now();
end;
$$;

revoke all on function public.admin_archive_player(uuid) from public, anon;
grant execute on function public.admin_archive_player(uuid) to authenticated;
