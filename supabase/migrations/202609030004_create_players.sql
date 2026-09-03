create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) > 0),
  mobile_phone text,
  birth_date date,
  shirt_number integer check (shirt_number is null or shirt_number between 1 and 99),
  is_active boolean not null default true,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists players_profile_id_unique
  on public.players(profile_id)
  where profile_id is not null;

create index if not exists players_active_name_idx
  on public.players(is_active, full_name);
