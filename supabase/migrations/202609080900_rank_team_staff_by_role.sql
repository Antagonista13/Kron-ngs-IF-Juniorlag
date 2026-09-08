-- Automatisk ledarstabsordning:
-- Team Manager -> Head Coach -> Coach -> Ass Coach -> Målvaktstränare -> Fystränare -> övriga.
-- Inom samma rollkategori sorteras efternamn alfabetiskt.

create or replace function public.rank_team_staff_for_team(p_team text)
returns void
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      id,
      row_number() over (
        order by
          case
            when lower(coalesce(staff_role,'')) like '%team manager%' then 1
            when lower(coalesce(staff_role,'')) like '%head coach%'
              or lower(coalesce(staff_role,'')) like '%huvudtränare%' then 2
            when lower(coalesce(staff_role,'')) like '%ass coach%'
              or lower(coalesce(staff_role,'')) like '%assistant coach%'
              or lower(coalesce(staff_role,'')) like '%assisterande tränare%' then 4
            when lower(coalesce(staff_role,'')) like '%målvakt%'
              or lower(coalesce(staff_role,'')) like '%goalkeeper%' then 5
            when lower(coalesce(staff_role,'')) like '%fystränare%'
              or lower(coalesce(staff_role,'')) like '%fitness coach%' then 6
            when lower(coalesce(staff_role,'')) = 'coach'
              or lower(coalesce(staff_role,'')) like '% tränare%'
              or lower(coalesce(staff_role,'')) like '%-tränare%' then 3
            else 7
          end,
          lower(regexp_replace(trim(display_name), '^.*\s', '')),
          lower(trim(display_name)),
          id
      ) as position
    from public.team_staff
    where team = p_team
      and is_active = true
  )
  update public.team_staff as staff
  set sort_order = ranked.position * 10
  from ranked
  where staff.id = ranked.id
    and staff.sort_order is distinct from ranked.position * 10;
$$;

create or replace function public.auto_rank_team_staff()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rank_team_staff_for_team(new.team);

  if tg_op = 'UPDATE' and old.team is distinct from new.team then
    perform public.rank_team_staff_for_team(old.team);
  end if;

  return new;
end;
$$;

drop trigger if exists team_staff_auto_rank on public.team_staff;
create trigger team_staff_auto_rank
after insert or update of display_name, staff_role, is_active, team
on public.team_staff
for each row
execute function public.auto_rank_team_staff();

-- Ranka om befintliga lag direkt när migrationen installeras.
do $$
declare
  team_name text;
begin
  for team_name in
    select distinct team
    from public.team_staff
    where team is not null
  loop
    perform public.rank_team_staff_for_team(team_name);
  end loop;
end;
$$;
