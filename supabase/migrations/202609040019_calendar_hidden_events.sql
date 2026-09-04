create table if not exists public.calendar_hidden_events (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  external_event_key text not null,
  title text,
  start_at timestamptz,
  end_at timestamptz,
  hidden_by uuid not null references public.profiles(id),
  hidden_at timestamptz not null default now(),
  unique(team, external_event_key)
);

create index if not exists calendar_hidden_events_hidden_by_idx on public.calendar_hidden_events(hidden_by);

alter table public.calendar_hidden_events enable row level security;

drop policy if exists "calendar hidden events same team read" on public.calendar_hidden_events;
drop policy if exists "calendar hidden events admin read" on public.calendar_hidden_events;
create policy "calendar hidden events admin read"
on public.calendar_hidden_events for select to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id=(select auth.uid())
      and p.team=calendar_hidden_events.team
      and p.is_active=true
      and p.role='admin'
  )
);

create or replace function public.list_calendar_hidden_keys()
returns table(external_event_key text)
language plpgsql security definer set search_path=public
as $$
declare v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id=auth.uid();
  if v_profile.id is null or v_profile.is_active is not true or v_profile.role not in ('admin','coach','player','parent') then raise exception 'Not authorized'; end if;
  return query select h.external_event_key from public.calendar_hidden_events h where h.team=v_profile.team;
end;$$;

create or replace function public.hide_calendar_event(
  p_external_event_key text,
  p_title text default null,
  p_start_at timestamptz default null,
  p_end_at timestamptz default null
) returns public.calendar_hidden_events
language plpgsql security definer set search_path=public
as $$
declare v_profile public.profiles; v_row public.calendar_hidden_events;
begin
  select * into v_profile from public.profiles where id=auth.uid();
  if v_profile.id is null or v_profile.is_active is not true or v_profile.role not in ('admin','coach') then raise exception 'Not authorized'; end if;
  if length(btrim(coalesce(p_external_event_key,'')))=0 then raise exception 'External event key required'; end if;
  insert into public.calendar_hidden_events(team,external_event_key,title,start_at,end_at,hidden_by)
  values(v_profile.team,btrim(p_external_event_key),nullif(btrim(coalesce(p_title,'')),''),p_start_at,p_end_at,v_profile.id)
  on conflict(team,external_event_key) do update set title=excluded.title,start_at=excluded.start_at,end_at=excluded.end_at,hidden_by=excluded.hidden_by,hidden_at=now()
  returning * into v_row;
  return v_row;
end;$$;

create or replace function public.list_hidden_calendar_events()
returns setof public.calendar_hidden_events
language plpgsql security definer set search_path=public
as $$
declare v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id=auth.uid();
  if v_profile.id is null or v_profile.is_active is not true or v_profile.role = 'admin' is not true then raise exception 'Not authorized'; end if;
  return query select * from public.calendar_hidden_events where team=v_profile.team order by hidden_at desc;
end;$$;

create or replace function public.restore_calendar_event(p_hidden_event_id uuid)
returns void language plpgsql security definer set search_path=public
as $$
declare v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id=auth.uid();
  if v_profile.id is null or v_profile.is_active is not true or v_profile.role = 'admin' is not true then raise exception 'Not authorized'; end if;
  delete from public.calendar_hidden_events where id=p_hidden_event_id and team=v_profile.team;
end;$$;

revoke all on function public.list_calendar_hidden_keys() from public;
revoke all on function public.list_calendar_hidden_keys() from anon;
revoke all on function public.hide_calendar_event(text,text,timestamptz,timestamptz) from public;
revoke all on function public.hide_calendar_event(text,text,timestamptz,timestamptz) from anon;
revoke all on function public.list_hidden_calendar_events() from public;
revoke all on function public.list_hidden_calendar_events() from anon;
revoke all on function public.restore_calendar_event(uuid) from public;
revoke all on function public.restore_calendar_event(uuid) from anon;
grant execute on function public.list_calendar_hidden_keys() to authenticated;
grant execute on function public.hide_calendar_event(text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.list_hidden_calendar_events() to authenticated;
grant execute on function public.restore_calendar_event(uuid) to authenticated;
