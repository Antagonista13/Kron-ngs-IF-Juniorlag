create policy "Players can view their own subgoals"
on public.development_subgoals
for select
to authenticated
using (
  exists (
    select 1
    from public.development_goals g
    where g.id = development_subgoals.goal_id
      and g.player_id = auth.uid()
  )
);
