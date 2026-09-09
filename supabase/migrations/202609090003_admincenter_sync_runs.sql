create table if not exists public.sportadmin_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null,
  finished_at timestamptz not null,
  status text not null check (status in ('success','failure')),
  found integer not null default 0 check (found >= 0),
  imported integer not null default 0 check (imported >= 0),
  source text not null default 'sportadmin_junior',
  error_message text,
  triggered_by text not null check (triggered_by in ('scheduled','admin'))
);

create index if not exists sportadmin_sync_runs_finished_at_idx
  on public.sportadmin_sync_runs (finished_at desc);

alter table public.sportadmin_sync_runs enable row level security;

revoke all on table public.sportadmin_sync_runs from anon;
revoke insert, update, delete on table public.sportadmin_sync_runs from authenticated;
grant select on table public.sportadmin_sync_runs to authenticated;

drop policy if exists "active admins read sportadmin_sync_runs" on public.sportadmin_sync_runs;
create policy "active admins read sportadmin_sync_runs" on public.sportadmin_sync_runs
for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  )
);
