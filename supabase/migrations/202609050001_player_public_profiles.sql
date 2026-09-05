alter table public.players
  add column if not exists position text,
  add column if not exists team_role text;

alter table public.players drop constraint if exists players_position_check;
alter table public.players add constraint players_position_check
  check (position is null or position in ('Målvakt','Försvarare','Mittfältare','Anfallare'));

alter table public.players drop constraint if exists players_team_role_check;
alter table public.players add constraint players_team_role_check
  check (team_role is null or team_role in ('captain','vice_captain'));

-- Active signed-in team members may read active roster rows so Player/Parent
-- can see the neutral team profile. Development tables retain their separate
-- leader/own-player policies.
drop policy if exists "active members read active players" on public.players;
create policy "active members read active players"
on public.players for select
to authenticated
using (current_profile_active() and is_active = true);

-- Position and team role are Admin-owned presentation fields. Existing
-- leader roster editing remains available for the other player fields.
create or replace function public.protect_player_admin_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if (new.position is not null or new.team_role is not null)
       and not (current_profile_active() and current_profile_role() = 'admin') then
      raise exception 'Only active admins may set player profile presentation fields';
    end if;
    return new;
  end if;

  if (new.position is distinct from old.position
      or new.team_role is distinct from old.team_role)
     and not (current_profile_active() and current_profile_role() = 'admin') then
    raise exception 'Only active admins may change player profile presentation fields';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_player_admin_fields on public.players;
create trigger protect_player_admin_fields
before insert or update on public.players
for each row execute function public.protect_player_admin_fields();
