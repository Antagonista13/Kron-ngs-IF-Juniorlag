alter table public.players enable row level security;

grant select, insert, update on public.players to authenticated;

create policy "leaders can read all players"
on public.players
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('coach','admin')
  )
);

create policy "players can read own player row"
on public.players
for select
to authenticated
using (
  profile_id = auth.uid()
  or (
    profile_id is null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'player'
        and lower(trim(p.full_name)) = lower(trim(players.full_name))
    )
  )
);

create policy "leaders can add players"
on public.players
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('coach','admin')
  )
);

create policy "leaders can update players"
on public.players
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('coach','admin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('coach','admin')
  )
);
