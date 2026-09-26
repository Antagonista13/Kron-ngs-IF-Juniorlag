create or replace function public.enforce_admin_only_player_nickname()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if coalesce(public.current_profile_role(), '') <> 'admin' then
      new.nickname := null;
    end if;
  elsif new.nickname is distinct from old.nickname
    and coalesce(public.current_profile_role(), '') <> 'admin' then
    new.nickname := old.nickname;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_only_player_nickname on public.players;
create trigger trg_admin_only_player_nickname
before insert or update on public.players
for each row execute function public.enforce_admin_only_player_nickname();
