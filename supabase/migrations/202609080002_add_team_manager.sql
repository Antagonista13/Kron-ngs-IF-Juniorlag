insert into public.team_staff (team, display_name, staff_role, description, sort_order, is_active)
select 'Kronängs IF Juniorlag', 'Henric', 'Team Manager / Administratör', 'Team Manager för juniorlaget.', 30, true
where not exists (
  select 1 from public.team_staff
  where team = 'Kronängs IF Juniorlag'
    and lower(display_name) = lower('Henric')
    and is_active = true
);
