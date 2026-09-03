alter table public.profiles
  add column if not exists player_number integer,
  add column if not exists avatar_url text;
