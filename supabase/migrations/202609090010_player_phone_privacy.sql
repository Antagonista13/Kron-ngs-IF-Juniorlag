create table if not exists public.player_contact_preferences (
  player_id uuid primary key references public.players(id) on delete cascade,
  mobile_phone text,
  visibility text not null default 'hidden' check (visibility in ('hidden','coaches','team')),
  source text not null default 'sportadmin',
  updated_at timestamptz not null default now()
);

insert into public.player_contact_preferences (player_id, mobile_phone, visibility, source, updated_at)
select id, nullif(trim(mobile_phone), ''), 'hidden', 'sportadmin', now()
from public.players
where nullif(trim(mobile_phone), '') is not null
on conflict (player_id) do update
set mobile_phone = excluded.mobile_phone,
    updated_at = now();

-- Contact details no longer live on the broadly used players row.
update public.players set mobile_phone = null where mobile_phone is not null;

alter table public.player_contact_preferences enable row level security;

revoke all on public.player_contact_preferences from anon;
grant select on public.player_contact_preferences to authenticated;

create or replace function public.current_phone_viewer_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create policy "phone admin read"
on public.player_contact_preferences
for select
to authenticated
using (public.current_phone_viewer_role() = 'admin');

create policy "phone player reads own"
on public.player_contact_preferences
for select
to authenticated
using (
  exists (
    select 1 from public.players p
    where p.id = player_contact_preferences.player_id
      and p.profile_id = auth.uid()
  )
);

create policy "phone coaches read shared"
on public.player_contact_preferences
for select
to authenticated
using (
  public.current_phone_viewer_role() = 'coach'
  and visibility in ('coaches','team')
);

create policy "phone players read team shared"
on public.player_contact_preferences
for select
to authenticated
using (
  public.current_phone_viewer_role() = 'player'
  and visibility = 'team'
);

create or replace function public.update_my_phone_visibility(p_visibility text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  if p_visibility not in ('hidden','coaches','team') then
    raise exception 'Invalid visibility';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'player' and is_active = true
  ) then
    raise exception 'Forbidden';
  end if;

  select p.id into v_player_id
  from public.players p
  where p.profile_id = auth.uid()
  limit 1;

  if v_player_id is null then
    select p.id into v_player_id
    from public.players p
    join public.profiles pr on pr.id = auth.uid()
    where lower(trim(p.full_name)) = lower(trim(pr.full_name))
      and p.is_active = true
    limit 1;
  end if;

  if v_player_id is null then
    raise exception 'Player link missing';
  end if;

  insert into public.player_contact_preferences (player_id, visibility, updated_at)
  values (v_player_id, p_visibility, now())
  on conflict (player_id) do update
  set visibility = excluded.visibility,
      updated_at = now();

  return p_visibility;
end;
$$;

grant execute on function public.update_my_phone_visibility(text) to authenticated;

create or replace function public.get_visible_player_phone(p_player_id uuid)
returns table(mobile_phone text, visibility text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_visibility text;
  v_phone text;
  v_is_owner boolean;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid() and is_active = true;

  if v_role is null then return; end if;

  select c.mobile_phone, c.visibility
    into v_phone, v_visibility
  from public.player_contact_preferences c
  where c.player_id = p_player_id;

  if v_phone is null then return; end if;

  select exists(
    select 1 from public.players p
    where p.id = p_player_id and p.profile_id = auth.uid()
  ) into v_is_owner;

  if v_role = 'admin'
     or v_is_owner
     or (v_role = 'coach' and v_visibility in ('coaches','team'))
     or (v_role = 'player' and v_visibility = 'team') then
    return query select v_phone, v_visibility;
  end if;
end;
$$;

grant execute on function public.get_visible_player_phone(uuid) to authenticated;

create or replace function public.get_my_phone_preference()
returns table(mobile_phone text, visibility text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
begin
  select p.id into v_player_id
  from public.players p
  where p.profile_id = auth.uid()
  limit 1;

  if v_player_id is null then
    select p.id into v_player_id
    from public.players p
    join public.profiles pr on pr.id = auth.uid()
    where lower(trim(p.full_name)) = lower(trim(pr.full_name))
      and p.is_active = true
    limit 1;
  end if;

  if v_player_id is null then return; end if;

  return query
  select c.mobile_phone, c.visibility
  from public.player_contact_preferences c
  where c.player_id = v_player_id;
end;
$$;

grant execute on function public.get_my_phone_preference() to authenticated;
