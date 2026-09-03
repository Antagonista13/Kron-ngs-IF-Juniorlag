-- Canonical role model and pending-account bootstrap for Kronängs IF Juniorlag.
-- Existing profiles keep their current role and remain active.

alter table public.profiles
  add column if not exists display_title text,
  add column if not exists is_active boolean not null default true;

update public.profiles
set is_active = true
where is_active is null;

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'profiles'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', constraint_row.conname);
  end loop;
end
$$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin','coach','player','parent','pending'));

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'pending');
$$;

create or replace function public.current_profile_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_active from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_active = true
  );
$$;

create or replace function public.is_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin','coach')
      and p.is_active = true
  );
$$;

revoke execute on function public.current_profile_role() from public;
revoke execute on function public.current_profile_active() from public;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_leader() from public;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.current_profile_active() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_leader() to authenticated;

create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  expected_role text check (expected_role is null or expected_role in ('player','parent','coach')),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_invitations_email_idx
  on public.user_invitations (lower(email), created_at desc);

alter table public.user_invitations enable row level security;

drop policy if exists "admins can read invitations" on public.user_invitations;
create policy "admins can read invitations"
on public.user_invitations for select to authenticated
using (public.is_admin());

drop policy if exists "admins can create invitations" on public.user_invitations;
create policy "admins can create invitations"
on public.user_invitations for insert to authenticated
with check (public.is_admin() and invited_by = auth.uid());

drop policy if exists "admins can update invitations" on public.user_invitations;
create policy "admins can update invitations"
on public.user_invitations for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.handle_new_kronang_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Nytt konto');

  insert into public.profiles (id, full_name, team, role, is_active)
  values (new.id, v_full_name, 'Kronängs IF Juniorlag', 'pending', true)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_kronang on auth.users;
create trigger on_auth_user_created_kronang
after insert on auth.users
for each row execute function public.handle_new_kronang_user();
