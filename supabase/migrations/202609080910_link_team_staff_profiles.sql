alter table public.team_staff
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create unique index if not exists team_staff_profile_id_unique
  on public.team_staff(profile_id)
  where profile_id is not null;

with candidates as (
  select
    ts.id as staff_id,
    p.id as profile_id,
    count(*) over (partition by p.id) as profile_matches,
    count(*) over (partition by ts.id) as staff_matches
  from public.team_staff ts
  join public.profiles p on p.team = ts.team and p.role in ('coach','admin')
  left join auth.users u on u.id = p.id
  where ts.profile_id is null
    and ts.is_active = true
    and (
      lower(trim(ts.display_name)) = lower(trim(p.full_name))
      or (
        nullif(trim(ts.email),'') is not null
        and nullif(trim(u.email),'') is not null
        and lower(trim(ts.email)) = lower(trim(u.email))
      )
    )
)
update public.team_staff ts
set profile_id = c.profile_id,
    updated_at = now()
from candidates c
where ts.id = c.staff_id
  and c.profile_matches = 1
  and c.staff_matches = 1;

create or replace function public.ensure_my_team_staff_link()
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_team text;
  v_name text;
  v_email text;
  v_existing bigint;
  v_candidate bigint;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.team, p.full_name, u.email
    into v_team, v_name, v_email
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = v_user_id
    and p.role in ('coach','admin')
    and coalesce(p.is_active,true) = true;

  if v_team is null then
    return null;
  end if;

  select id into v_existing
  from public.team_staff
  where profile_id = v_user_id
    and is_active = true
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  select count(*), min(id)
    into v_count, v_candidate
  from public.team_staff
  where team = v_team
    and profile_id is null
    and is_active = true
    and (
      lower(trim(display_name)) = lower(trim(v_name))
      or (
        nullif(trim(email),'') is not null
        and nullif(trim(v_email),'') is not null
        and lower(trim(email)) = lower(trim(v_email))
      )
    );

  if v_count = 1 then
    update public.team_staff
    set profile_id = v_user_id,
        updated_at = now()
    where id = v_candidate
      and profile_id is null;
    return v_candidate;
  end if;

  return null;
end;
$$;

create or replace function public.update_my_team_staff_description(p_description text)
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_staff_id bigint;
  v_description text := trim(coalesce(p_description,''));
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if char_length(v_description) > 500 then
    raise exception 'Description is too long';
  end if;

  v_staff_id := public.ensure_my_team_staff_link();
  if v_staff_id is null then
    raise exception 'No linked staff profile';
  end if;

  update public.team_staff
  set description = nullif(v_description,''),
      updated_at = now()
  where id = v_staff_id
    and profile_id = auth.uid()
    and is_active = true;

  if not found then
    raise exception 'Staff profile update denied';
  end if;

  return v_staff_id;
end;
$$;

revoke all on function public.ensure_my_team_staff_link() from public;
revoke all on function public.update_my_team_staff_description(text) from public;
grant execute on function public.ensure_my_team_staff_link() to authenticated;
grant execute on function public.update_my_team_staff_description(text) to authenticated;
