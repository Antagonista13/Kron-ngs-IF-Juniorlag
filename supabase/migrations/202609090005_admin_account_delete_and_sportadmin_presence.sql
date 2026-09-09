-- Admin-only account removal plus safe review of players no longer present in SportAdmin.

create table if not exists public.sportadmin_player_presence (
  player_id uuid primary key references public.players(id) on delete cascade,
  normalized_name text not null,
  state text not null default 'present' check (state in ('present','missing','kept')),
  last_seen_at timestamptz,
  missing_since timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.sportadmin_player_presence enable row level security;

drop policy if exists "active admins read sportadmin presence" on public.sportadmin_player_presence;
create policy "active admins read sportadmin presence" on public.sportadmin_player_presence
for select to authenticated using (public.is_admin());

create or replace function public.admin_delete_user(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
begin
  if not public.is_admin() then raise exception 'Endast Admin kan radera användarkonton.'; end if;
  if p_profile_id = auth.uid() then raise exception 'Du kan inte radera ditt eget adminkonto.'; end if;
  select role into v_role from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'Användaren saknar profil.'; end if;
  if v_role = 'admin' then raise exception 'Adminkonton kan inte raderas här.'; end if;
  update public.players set profile_id = null, updated_at = now() where profile_id = p_profile_id;
  delete from auth.users where id = p_profile_id;
end;
$$;

create or replace function public.list_missing_sportadmin_players()
returns table(player_id uuid, full_name text, missing_since timestamptz)
language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'Endast Admin kan granska SportAdmin-avvikelser.'; end if;
  return query select p.id,p.full_name,sp.missing_since
  from public.sportadmin_player_presence sp join public.players p on p.id=sp.player_id
  where sp.state='missing' and p.is_active=true order by p.full_name;
end;$$;

create or replace function public.admin_keep_missing_sportadmin_player(p_player_id uuid)
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.is_admin() then raise exception 'Endast Admin kan hantera SportAdmin-avvikelser.'; end if;
  update public.sportadmin_player_presence set state='kept',updated_at=now() where player_id=p_player_id and state='missing';
end; $$;

create or replace function public.admin_archive_missing_sportadmin_player(p_player_id uuid)
returns void language plpgsql security definer set search_path=public
as $$ begin
  if not public.is_admin() then raise exception 'Endast Admin kan ta bort spelare från laget.'; end if;
  if not exists(select 1 from public.sportadmin_player_presence where player_id=p_player_id and state='missing') then raise exception 'Spelaren är inte markerad som saknad i SportAdmin.'; end if;
  update public.players set is_active=false,updated_at=now() where id=p_player_id;
end; $$;

revoke all on public.sportadmin_player_presence from anon,authenticated;
grant select on public.sportadmin_player_presence to authenticated;
revoke execute on function public.admin_delete_user(uuid) from public;
revoke execute on function public.list_missing_sportadmin_players() from public;
revoke execute on function public.admin_keep_missing_sportadmin_player(uuid) from public;
revoke execute on function public.admin_archive_missing_sportadmin_player(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.list_missing_sportadmin_players() to authenticated;
grant execute on function public.admin_keep_missing_sportadmin_player(uuid) to authenticated;
grant execute on function public.admin_archive_missing_sportadmin_player(uuid) to authenticated;
