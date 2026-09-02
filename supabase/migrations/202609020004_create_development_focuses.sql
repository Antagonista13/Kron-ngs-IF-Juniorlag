-- Baseline migration for the first player-focus database step.
-- This schema was applied manually in Supabase on 2026-09-02 and is stored
-- here so the repository documents the database state.

create table if not exists public.development_focuses (
  id uuid primary key default gen_random_uuid(),

  player_id uuid not null
    references public.profiles(id),

  development_area text not null
    check (
      development_area in (
        'technique',
        'game_understanding',
        'physical',
        'mentality'
      )
    ),

  focus_text text not null
    check (
      char_length(btrim(focus_text)) between 1 and 160
    ),

  attention_text text
    check (
      attention_text is null
      or char_length(btrim(attention_text)) between 1 and 1000
    ),

  lifecycle_status text not null default 'active'
    check (
      lifecycle_status in ('active', 'ended', 'replaced')
    ),

  follow_up_status text not null default 'active'
    check (
      follow_up_status in (
        'active',
        'following_up',
        'follow_up_complete'
      )
    ),

  player_reflection text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);

create unique index if not exists development_focuses_one_active_per_player
on public.development_focuses (player_id)
where lifecycle_status = 'active';

alter table public.development_focuses
enable row level security;