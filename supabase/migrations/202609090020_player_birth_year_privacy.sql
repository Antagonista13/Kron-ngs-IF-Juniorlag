drop function if exists public.list_public_roster_players();

create function public.list_public_roster_players()
returns table(
  id uuid,
  full_name text,
  birth_year text,
  shirt_number integer,
  "position" text,
  team_role text,
  avatar_url text,
  public_about_me text,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    case when p.birth_date is null then null else extract(year from p.birth_date)::int::text end as birth_year,
    p.shirt_number,
    p.position,
    p.team_role,
    p.avatar_url,
    p.public_about_me,
    p.is_active
  from public.players p
  where p.is_active = true
    and public.current_profile_active()
    and public.current_profile_role() in ('admin','coach','player','parent')
  order by p.full_name;
$$;

grant execute on function public.list_public_roster_players() to authenticated;

create or replace function public.list_coach_roster_players()
returns table(
  id uuid,
  full_name text,
  birth_year text,
  shirt_number integer,
  "position" text,
  team_role text,
  is_active boolean,
  profile_id uuid,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    case when p.birth_date is null then null else extract(year from p.birth_date)::int::text end as birth_year,
    p.shirt_number,
    p.position,
    p.team_role,
    p.is_active,
    p.profile_id,
    p.avatar_url
  from public.players p
  where public.current_profile_active()
    and public.current_profile_role() = 'coach'
  order by p.full_name;
$$;

grant execute on function public.list_coach_roster_players() to authenticated;
