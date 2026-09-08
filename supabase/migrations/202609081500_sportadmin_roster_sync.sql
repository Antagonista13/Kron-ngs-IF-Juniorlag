create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.sportadmin_player_candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  normalized_name text not null,
  source text not null default 'sportadmin_p2011',
  source_url text not null default 'https://www.kronangsif.se/grupp/?ID=260563',
  status text not null default 'pending' check (status in ('pending','approved','dismissed')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_player_id uuid references public.players(id),
  unique(source, normalized_name)
);

alter table public.sportadmin_player_candidates enable row level security;
revoke all on public.sportadmin_player_candidates from anon, authenticated;

grant select on public.sportadmin_player_candidates to authenticated;
create policy "active admins may read sportadmin candidates"
on public.sportadmin_player_candidates for select to authenticated
using (public.is_admin());

create or replace function public.list_sportadmin_player_candidates()
returns setof public.sportadmin_player_candidates
language sql stable security definer set search_path=public
as $$
  select * from public.sportadmin_player_candidates
  where public.is_admin() and status='pending'
  order by first_seen_at desc, full_name;
$$;
grant execute on function public.list_sportadmin_player_candidates() to authenticated;

create or replace function public.approve_sportadmin_player_candidate(p_candidate_id uuid)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare v public.sportadmin_player_candidates; v_player_id uuid;
begin
  if not public.is_admin() then raise exception 'Endast Admin kan godkänna SportAdmin-spelare.'; end if;
  select * into v from public.sportadmin_player_candidates where id=p_candidate_id for update;
  if not found or v.status<>'pending' then raise exception 'Spelaren väntar inte på godkännande.'; end if;
  select id into v_player_id from public.players where lower(regexp_replace(full_name,'\\s+',' ','g'))=lower(v.full_name) limit 1;
  if v_player_id is null then
    insert into public.players(full_name,is_active) values(v.full_name,true) returning id into v_player_id;
  else
    update public.players set is_active=true,updated_at=now() where id=v_player_id;
  end if;
  update public.sportadmin_player_candidates set status='approved',reviewed_at=now(),reviewed_by=auth.uid(),created_player_id=v_player_id where id=p_candidate_id;
  return v_player_id;
end;
$$;
grant execute on function public.approve_sportadmin_player_candidate(uuid) to authenticated;

create or replace function public.dismiss_sportadmin_player_candidate(p_candidate_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() then raise exception 'Endast Admin kan avvisa SportAdmin-spelare.'; end if;
  update public.sportadmin_player_candidates set status='dismissed',reviewed_at=now(),reviewed_by=auth.uid() where id=p_candidate_id and status='pending';
end;
$$;
grant execute on function public.dismiss_sportadmin_player_candidate(uuid) to authenticated;

select cron.unschedule(jobid) from cron.job where jobname='sportadmin-p2011-roster-daily';
select cron.schedule(
  'sportadmin-p2011-roster-daily',
  '15 3 * * *',
  $$select net.http_post(
      url:='https://ndbwnsiqcnxppikdrwvd.supabase.co/functions/v1/sportadmin-roster-sync',
      headers:='{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYnduc2lxY254cHBpa2Ryd3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjIwNTIsImV4cCI6MjEwMzgzODA1Mn0.ohJ9vdvgBXIGMsmH3wCiK7n0-PDWGp_Mt895UDTQoxA","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYnduc2lxY254cHBpa2Ryd3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjIwNTIsImV4cCI6MjEwMzgzODA1Mn0.ohJ9vdvgBXIGMsmH3wCiK7n0-PDWGp_Mt895UDTQoxA"}'::jsonb,
      body:='{}'::jsonb
    );$$
);
