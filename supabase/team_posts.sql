create table if not exists public.team_posts (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 3000),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_posts enable row level security;

drop policy if exists "team_posts_select_same_team" on public.team_posts;
create policy "team_posts_select_same_team"
on public.team_posts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.team = team_posts.team
  )
);

drop policy if exists "team_posts_insert_coach_same_team" on public.team_posts;
create policy "team_posts_insert_coach_same_team"
on public.team_posts
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_coach()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.team = team_posts.team
  )
);

drop policy if exists "team_posts_update_coach_same_team" on public.team_posts;
create policy "team_posts_update_coach_same_team"
on public.team_posts
for update
to authenticated
using (
  public.is_coach()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.team = team_posts.team
  )
)
with check (
  public.is_coach()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.team = team_posts.team
  )
);

drop policy if exists "team_posts_delete_coach_same_team" on public.team_posts;
create policy "team_posts_delete_coach_same_team"
on public.team_posts
for delete
to authenticated
using (
  public.is_coach()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.team = team_posts.team
  )
);
