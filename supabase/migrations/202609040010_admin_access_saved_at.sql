-- Persist when Admin last saved a user's role/access settings.

alter table public.profiles
  add column if not exists access_updated_at timestamptz;

-- The return shape changes, so recreate the list RPC with the new column.
drop function if exists public.admin_list_users();

create function public.admin_list_users()
returns table (
  profile_id uuid,
  email text,
  full_name text,
  role text,
  display_title text,
  is_active boolean,
  player_id uuid,
  invitation_status text,
  expected_role text,
  access_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Endast Admin kan hantera användare.';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.role,
    p.display_title,
    p.is_active,
    pl.id,
    inv.status,
    inv.expected_role,
    p.access_updated_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.players pl on pl.profile_id = p.id
  left join lateral (
    select i.status, i.expected_role
    from public.user_invitations i
    where lower(i.email) = lower(u.email)
    order by i.created_at desc
    limit 1
  ) inv on true
  order by p.full_name nulls last, u.email;
end;
$$;

create or replace function public.admin_approve_user(
  p_profile_id uuid,
  p_role text,
  p_player_id uuid default null,
  p_display_title text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_current_role text;
  v_user_email text;
  v_player public.players%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Endast Admin kan godkänna användare.';
  end if;
  if p_role not in ('player','parent','coach') then raise exception 'Ogiltig roll.'; end if;
  select p.role into v_current_role from public.profiles p where p.id = p_profile_id for update;
  if not found then raise exception 'Användaren saknar profil.'; end if;
  if v_current_role = 'admin' then raise exception 'Adminrollen kan inte ändras i detta flöde.'; end if;
  select u.email::text into v_user_email from auth.users u where u.id = p_profile_id;
  update public.players set profile_id = null, updated_at = now() where profile_id = p_profile_id;
  if p_role = 'player' then
    if p_player_id is null then raise exception 'Spelare måste kopplas till en spelarpost.'; end if;
    select * into v_player from public.players where id = p_player_id for update;
    if not found or v_player.is_active is not true then raise exception 'Vald spelarpost är inte aktiv.'; end if;
    if v_player.profile_id is not null and v_player.profile_id <> p_profile_id then raise exception 'Spelarposten är redan kopplad till ett annat konto.'; end if;
    update public.players set profile_id = p_profile_id, updated_at = now() where id = p_player_id;
  end if;
  update public.profiles
  set role = p_role,
      display_title = case when p_role = 'coach' then nullif(btrim(p_display_title), '') else null end,
      is_active = true,
      access_updated_at = now()
  where id = p_profile_id;
  update public.user_invitations set status = 'accepted', updated_at = now() where lower(email) = lower(v_user_email) and status = 'pending';
end;
$$;

create or replace function public.admin_update_user_access(
  p_profile_id uuid,
  p_role text,
  p_player_id uuid default null,
  p_display_title text default null,
  p_is_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_current_role text;
  v_player public.players%rowtype;
begin
  if not public.is_admin() then raise exception 'Endast Admin kan ändra användaråtkomst.'; end if;
  if p_role not in ('player','parent','coach') then raise exception 'Ogiltig roll.'; end if;
  select p.role into v_current_role from public.profiles p where p.id = p_profile_id for update;
  if not found then raise exception 'Användaren saknar profil.'; end if;
  if v_current_role = 'admin' then raise exception 'Adminrollen kan inte ändras i detta flöde.'; end if;
  update public.players set profile_id = null, updated_at = now() where profile_id = p_profile_id;
  if p_role = 'player' then
    if p_player_id is null then raise exception 'Spelare måste kopplas till en spelarpost.'; end if;
    select * into v_player from public.players where id = p_player_id for update;
    if not found or v_player.is_active is not true then raise exception 'Vald spelarpost är inte aktiv.'; end if;
    if v_player.profile_id is not null and v_player.profile_id <> p_profile_id then raise exception 'Spelarposten är redan kopplad till ett annat konto.'; end if;
    update public.players set profile_id = p_profile_id, updated_at = now() where id = p_player_id;
  end if;
  update public.profiles
  set role = p_role,
      display_title = case when p_role = 'coach' then nullif(btrim(p_display_title), '') else null end,
      is_active = coalesce(p_is_active, true),
      access_updated_at = now()
  where id = p_profile_id;
end;
$$;

revoke execute on function public.admin_list_users() from public;
revoke execute on function public.admin_approve_user(uuid,text,uuid,text) from public;
revoke execute on function public.admin_update_user_access(uuid,text,uuid,text,boolean) from public;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_approve_user(uuid,text,uuid,text) to authenticated;
grant execute on function public.admin_update_user_access(uuid,text,uuid,text,boolean) to authenticated;
