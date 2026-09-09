create or replace function public.list_sportadmin_player_candidates()
returns setof public.sportadmin_player_candidates
language sql stable security definer set search_path=public
as $$
  select * from public.sportadmin_player_candidates
  where public.is_admin()
    and status='approved'
    and reviewed_at is null
  order by first_seen_at desc, full_name;
$$;
grant execute on function public.list_sportadmin_player_candidates() to authenticated;

create or replace function public.acknowledge_sportadmin_player_candidate(p_candidate_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'Endast Admin kan markera SportAdmin-spelare som sedda.'; end if;
  update public.sportadmin_player_candidates
  set reviewed_at=now(), reviewed_by=auth.uid()
  where id=p_candidate_id and status='approved' and reviewed_at is null;
end;
$$;
grant execute on function public.acknowledge_sportadmin_player_candidate(uuid) to authenticated;
