create or replace function public.admin_archive_player(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_profile_active()
     or public.current_profile_role() <> 'admin' then
    raise exception 'Only an active admin can remove a player from the app';
  end if;

  update public.players
  set is_active = false,
      updated_at = now()
  where id = p_player_id
    and is_active = true;

  if not found then
    raise exception 'Player was not found or is already removed';
  end if;
end;
$$;

revoke all on function public.admin_archive_player(uuid) from public;
revoke all on function public.admin_archive_player(uuid) from anon;
grant execute on function public.admin_archive_player(uuid) to authenticated;

create or replace function public.enforce_admin_player_archive()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.is_active = true and new.is_active = false then
    if auth.uid() is not null
       and (not public.current_profile_active()
            or public.current_profile_role() <> 'admin') then
      raise exception 'Only an active admin can remove a player from the app';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists players_admin_archive_guard on public.players;
create trigger players_admin_archive_guard
before update on public.players
for each row
execute function public.enforce_admin_player_archive();
