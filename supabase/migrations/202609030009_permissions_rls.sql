-- Canonical RLS for active Admin, Coach, Player and Parent roles.
-- Unknown, pending and disabled profiles have no team-data access.

alter table public.players enable row level security;
drop policy if exists "leaders can read all players" on public.players;
drop policy if exists "players can read own player row" on public.players;
drop policy if exists "leaders can add players" on public.players;
drop policy if exists "leaders can update players" on public.players;
drop policy if exists "role leaders read players" on public.players;
drop policy if exists "role players read own row" on public.players;
drop policy if exists "role leaders insert players" on public.players;
drop policy if exists "role leaders update players" on public.players;
create policy "role leaders read players" on public.players for select to authenticated using (public.is_leader());
create policy "role players read own row" on public.players for select to authenticated using (
  public.current_profile_active() and public.current_profile_role() = 'player'
  and (profile_id = auth.uid() or (profile_id is null and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'player' and p.is_active = true
      and lower(trim(p.full_name)) = lower(trim(players.full_name))
  )))
);
create policy "role leaders insert players" on public.players for insert to authenticated with check (public.is_leader());
create policy "role leaders update players" on public.players for update to authenticated using (public.is_leader()) with check (public.is_leader());

do $$ begin
  if to_regclass('public.team_posts') is not null then
    execute 'alter table public.team_posts enable row level security';
    execute 'drop policy if exists "team_posts_select_same_team" on public.team_posts';
    execute 'drop policy if exists "team_posts_insert_coach_same_team" on public.team_posts';
    execute 'drop policy if exists "team_posts_update_coach_same_team" on public.team_posts';
    execute 'drop policy if exists "team_posts_delete_coach_same_team" on public.team_posts';
    execute 'drop policy if exists "role active team reads posts" on public.team_posts';
    execute 'drop policy if exists "role leaders insert posts" on public.team_posts';
    execute 'drop policy if exists "role leaders update posts" on public.team_posts';
    execute 'drop policy if exists "role leaders delete posts" on public.team_posts';
    execute $p$create policy "role active team reads posts" on public.team_posts for select to authenticated using (
      public.current_profile_active() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active = true
        and p.role in ('admin','coach','player','parent') and p.team = team_posts.team)
    )$p$;
    execute $p$create policy "role leaders insert posts" on public.team_posts for insert to authenticated with check (
      public.is_leader() and created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_posts.team)
    )$p$;
    execute $p$create policy "role leaders update posts" on public.team_posts for update to authenticated using (
      public.is_leader() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_posts.team)
    ) with check (public.is_leader() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_posts.team))$p$;
    execute $p$create policy "role leaders delete posts" on public.team_posts for delete to authenticated using (
      public.is_leader() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_posts.team)
    )$p$;
  end if;
end $$;

do $$ begin
  if to_regclass('public.team_focus') is not null then
    execute 'alter table public.team_focus enable row level security';
    execute 'drop policy if exists "team_focus_select_same_team" on public.team_focus';
    execute 'drop policy if exists "team_focus_insert_coach" on public.team_focus';
    execute 'drop policy if exists "team_focus_update_coach" on public.team_focus';
    execute 'drop policy if exists "role football roles read focus" on public.team_focus';
    execute 'drop policy if exists "role leaders insert focus" on public.team_focus';
    execute 'drop policy if exists "role leaders update focus" on public.team_focus';
    execute $p$create policy "role football roles read focus" on public.team_focus for select to authenticated using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active = true
        and p.role in ('admin','coach','player') and p.team = team_focus.team)
    )$p$;
    execute $p$create policy "role leaders insert focus" on public.team_focus for insert to authenticated with check (
      public.is_leader() and updated_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team)
    )$p$;
    execute $p$create policy "role leaders update focus" on public.team_focus for update to authenticated using (
      public.is_leader() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team)
    ) with check (public.is_leader() and updated_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team))$p$;
  end if;
end $$;

do $$ begin
  if to_regclass('public.team_challenges') is not null then
    execute 'alter table public.team_challenges enable row level security';
    execute 'drop policy if exists "team_challenges_select_same_team" on public.team_challenges';
    execute 'drop policy if exists "team_challenges_insert_coach" on public.team_challenges';
    execute 'drop policy if exists "team_challenges_update_coach" on public.team_challenges';
    execute 'drop policy if exists "role football roles read challenges" on public.team_challenges';
    execute 'drop policy if exists "role leaders insert challenges" on public.team_challenges';
    execute 'drop policy if exists "role leaders update challenges" on public.team_challenges';
    execute $p$create policy "role football roles read challenges" on public.team_challenges for select to authenticated using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active = true
        and p.role in ('admin','coach','player') and p.team = team_challenges.team)
    )$p$;
    execute $p$create policy "role leaders insert challenges" on public.team_challenges for insert to authenticated with check (
      public.is_leader() and created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team)
    )$p$;
    execute $p$create policy "role leaders update challenges" on public.team_challenges for update to authenticated using (
      public.is_leader() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team)
    ) with check (public.is_leader() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_challenges.team))$p$;
  end if;
end $$;

do $$ begin
  if to_regclass('public.challenge_completions') is not null then
    execute 'alter table public.challenge_completions enable row level security';
    execute 'drop policy if exists "challenge_completions_select_own" on public.challenge_completions';
    execute 'drop policy if exists "challenge_completions_insert_own" on public.challenge_completions';
    execute 'drop policy if exists "role players read own completions" on public.challenge_completions';
    execute 'drop policy if exists "role players create own completions" on public.challenge_completions';
    execute $p$create policy "role players read own completions" on public.challenge_completions for select to authenticated using (
      public.current_profile_active() and public.current_profile_role() = 'player' and player_id = auth.uid()
    )$p$;
    execute $p$create policy "role players create own completions" on public.challenge_completions for insert to authenticated with check (
      public.current_profile_active() and public.current_profile_role() = 'player' and player_id = auth.uid()
    )$p$;
  end if;
end $$;

do $$ begin
  if to_regclass('public.team_staff') is not null then
    execute 'alter table public.team_staff enable row level security';
    execute 'drop policy if exists "team staff readable by same team" on public.team_staff';
    execute 'drop policy if exists "role active team reads staff" on public.team_staff';
    execute $p$create policy "role active team reads staff" on public.team_staff for select to authenticated using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active = true
        and p.role in ('admin','coach','player','parent') and p.team = team_staff.team)
    )$p$;
  end if;
end $$;

alter table public.development_goals enable row level security;
drop policy if exists "Players can view their own goals" on public.development_goals;
drop policy if exists "role player own or leader goals" on public.development_goals;
create policy "role player own or leader goals" on public.development_goals for select to authenticated using (
  public.is_leader() or (public.current_profile_active() and public.current_profile_role() = 'player' and player_id = auth.uid())
);

alter table public.development_focuses enable row level security;
drop policy if exists "Players can view their own focuses" on public.development_focuses;
drop policy if exists "role player own or leader focuses" on public.development_focuses;
create policy "role player own or leader focuses" on public.development_focuses for select to authenticated using (
  public.is_leader() or (public.current_profile_active() and public.current_profile_role() = 'player' and player_id = auth.uid())
);

alter table public.development_subgoals enable row level security;
drop policy if exists "Players can view their own subgoals" on public.development_subgoals;
drop policy if exists "role player own or leader subgoals" on public.development_subgoals;
create policy "role player own or leader subgoals" on public.development_subgoals for select to authenticated using (
  public.is_leader() or exists (
    select 1 from public.development_goals g where g.id = development_subgoals.goal_id
      and public.current_profile_active() and public.current_profile_role() = 'player' and g.player_id = auth.uid()
  )
);

do $$ begin
  if to_regclass('public.development_assessments') is not null then
    execute 'alter table public.development_assessments enable row level security';
    execute 'drop policy if exists "role player own or leader assessments" on public.development_assessments';
    execute $p$create policy "role player own or leader assessments" on public.development_assessments for select to authenticated using (
      public.is_leader() or (public.current_profile_active() and public.current_profile_role() = 'player' and player_id = auth.uid())
    )$p$;
  end if;
end $$;

-- Active roles: 'admin', 'coach', 'player', 'parent'. Denied onboarding role: 'pending'.
