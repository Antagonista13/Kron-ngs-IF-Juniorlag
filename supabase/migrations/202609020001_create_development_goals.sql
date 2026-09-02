-- Baseline migration for the first player-goal database step.
-- This schema was applied manually in Supabase on 2026-09-02 and is stored
-- here so the repository documents the database state.

create table if not exists public.development_goals (
  id uuid primary key default gen_random_uuid(),

  player_id uuid not null
    references public.profiles(id),

  title text not null
    check (
      char_length(btrim(title)) between 1 and 120
    ),

  description text not null
    check (
      char_length(btrim(description)) between 1 and 2000
    ),

  success_description text
    check (
      success_description is null
      or char_length(btrim(success_description)) between 1 and 1000
    ),

  status text not null default 'active'
    check (
      status in ('active', 'completed', 'replaced')
    ),

  created_at timestamptz not null default now()
);

create unique index if not exists development_goals_one_active_per_player
on public.development_goals (player_id)
where status = 'active';

alter table public.development_goals
enable row level security;
