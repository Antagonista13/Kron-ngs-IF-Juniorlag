-- Coaches may read development context for players.
-- Writes remain unchanged: this migration only adds SELECT policies.

create policy "Coaches can read player goals"
on public.development_goals
for select
to authenticated
using (public.is_coach());

create policy "Coaches can read player subgoals"
on public.development_subgoals
for select
to authenticated
using (public.is_coach());

create policy "Coaches can read player focuses"
on public.development_focuses
for select
to authenticated
using (public.is_coach());
