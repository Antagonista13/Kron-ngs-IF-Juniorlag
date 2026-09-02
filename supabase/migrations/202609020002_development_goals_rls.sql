-- RLS for the first player-goal database step.
-- Players may read only their own goals. No coach access is added yet.

alter table public.development_goals
enable row level security;

drop policy if exists "Players can view their own goals"
on public.development_goals;

create policy "Players can view their own goals"
on public.development_goals
for select
to authenticated
using (
  player_id = auth.uid()
);
