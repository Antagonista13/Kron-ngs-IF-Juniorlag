-- RLS for the first player-focus database step.
-- Players may read only their own focuses. No coach access is added yet.

alter table public.development_focuses
enable row level security;

drop policy if exists "Players can view their own focuses"
on public.development_focuses;

create policy "Players can view their own focuses"
on public.development_focuses
for select
to authenticated
using (
  player_id = auth.uid()
);