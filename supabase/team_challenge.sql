create table if not exists public.team_challenges (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  title text not null check (char_length(title) between 1 and 160),
  instruction text not null check (char_length(instruction) between 1 and 1000),
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_completions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.team_challenges(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (challenge_id, player_id)
);

alter table public.team_challenges enable row level security;
alter table public.challenge_completions enable row level security;

drop policy if exists "team_challenges_select_same_team" on public.team_challenges;
create policy "team_challenges_select_same_team" on public.team_challenges
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team));

drop policy if exists "team_challenges_insert_coach" on public.team_challenges;
create policy "team_challenges_insert_coach" on public.team_challenges
for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team and p.role in ('coach','admin'))
);

drop policy if exists "team_challenges_update_coach" on public.team_challenges;
create policy "team_challenges_update_coach" on public.team_challenges
for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team and p.role in ('coach','admin')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team and p.role in ('coach','admin')));

drop policy if exists "challenge_completions_select_own" on public.challenge_completions;
create policy "challenge_completions_select_own" on public.challenge_completions
for select to authenticated
using (player_id = auth.uid());

drop policy if exists "challenge_completions_insert_own" on public.challenge_completions;
create policy "challenge_completions_insert_own" on public.challenge_completions
for insert to authenticated
with check (
  player_id = auth.uid()
  and exists (
    select 1 from public.team_challenges c
    join public.profiles p on p.id = auth.uid()
    where c.id = challenge_id and c.team = p.team and c.active = true and p.role = 'player'
  )
);
