-- Enforce the product rule that only an active Admin may set, change, or remove player profile images.
-- Leaders still retain their existing ability to maintain other roster fields.

create or replace function public.enforce_admin_player_avatar()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if tg_op = 'INSERT' then
    if new.avatar_url is not null
       and (public.current_profile_role() <> 'admin' or not public.current_profile_active()) then
      raise exception 'Not authorized';
    end if;
    return new;
  end if;

  if new.avatar_url is distinct from old.avatar_url
     and (public.current_profile_role() <> 'admin' or not public.current_profile_active()) then
    raise exception 'Not authorized';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_admin_player_avatar on public.players;
create trigger enforce_admin_player_avatar
before insert or update of avatar_url on public.players
for each row execute function public.enforce_admin_player_avatar();

revoke all on function public.enforce_admin_player_avatar() from public;
revoke all on function public.enforce_admin_player_avatar() from anon;
revoke all on function public.enforce_admin_player_avatar() from authenticated;
