-- Players can undo their own marks; active leaders can read their team's statistics.
-- Preserve existing rows and the player's existing SELECT policy.
grant select, insert, delete on public.challenge_completions to authenticated;

drop policy if exists "challenge_completions_select_team_leader" on public.challenge_completions;
create policy "challenge_completions_select_team_leader" on public.challenge_completions
for select to authenticated using (
  exists (
    select 1 from public.profiles viewer
    join public.profiles player on player.team = viewer.team
    join public.team_challenges challenge on challenge.id = challenge_completions.challenge_id and challenge.team = viewer.team
    where viewer.id = (select auth.uid()) and viewer.is_active and viewer.role in ('coach','admin')
      and player.id = challenge_completions.player_id and player.is_active and player.role = 'player'
  )
);

drop policy if exists "challenge_completions_delete_own" on public.challenge_completions;
create policy "challenge_completions_delete_own" on public.challenge_completions
for delete to authenticated using (
  player_id = (select auth.uid())
  and public.current_profile_active() and public.current_profile_role() = 'player'
  and exists (
    select 1 from public.team_challenges challenge
    join public.profiles viewer on viewer.id = (select auth.uid()) and viewer.team = challenge.team
    where challenge.id = challenge_completions.challenge_id
  )
);

-- Replace the prior INSERT policies so inactive or other-team challenges cannot be marked.
drop policy if exists "role players create own completions" on public.challenge_completions;
drop policy if exists "challenge_completions_insert_own" on public.challenge_completions;
create policy "challenge_completions_insert_own" on public.challenge_completions
for insert to authenticated with check (
  player_id = (select auth.uid())
  and public.current_profile_active() and public.current_profile_role() = 'player'
  and exists (
    select 1 from public.team_challenges challenge
    join public.profiles viewer on viewer.id = (select auth.uid()) and viewer.team = challenge.team
    where challenge.id = challenge_completions.challenge_id and challenge.active
      and challenge.created_at <= now()
      and challenge.created_at >= (date_trunc('week', now() at time zone 'Europe/Stockholm') at time zone 'Europe/Stockholm')
  )
);
