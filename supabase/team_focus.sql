create table if not exists public.team_focus (
  team text primary key,
  title text not null check (char_length(title) between 1 and 160),
  focus_words text not null check (char_length(focus_words) between 1 and 240),
  updated_by uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.team_focus enable row level security;

drop policy if exists "team_focus_select_same_team" on public.team_focus;
create policy "team_focus_select_same_team" on public.team_focus for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team));

drop policy if exists "team_focus_insert_coach" on public.team_focus;
create policy "team_focus_insert_coach" on public.team_focus for insert to authenticated
with check (updated_by = auth.uid() and public.is_coach() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team));

drop policy if exists "team_focus_update_coach" on public.team_focus;
create policy "team_focus_update_coach" on public.team_focus for update to authenticated
using (public.is_coach() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team))
with check (updated_by = auth.uid() and public.is_coach() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.team = team_focus.team));
