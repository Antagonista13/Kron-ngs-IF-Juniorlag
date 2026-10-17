-- One thumbs-up per active team member per team post.
create table if not exists public.team_post_likes (
  post_id uuid not null references public.team_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
create index if not exists team_post_likes_post_idx on public.team_post_likes(post_id);
alter table public.team_post_likes enable row level security;
revoke all on public.team_post_likes from public, anon, authenticated;

-- Expose only safe functions, never direct writes to the underlying table.
create or replace function public.team_post_likers(p_post_id uuid)
returns table(profile_id uuid, display_name text)
language plpgsql security definer set search_path = ''
as $$
declare v_team text;
begin
  select p.team into v_team
  from public.profiles p
  where p.id = auth.uid() and p.is_active is true and p.role in ('admin','coach','player');
  if v_team is null or not exists (
    select 1 from public.team_posts post where post.id=p_post_id and post.team=v_team
  ) then raise exception 'Not authorized'; end if;
  return query
  select l.profile_id, coalesce(nullif(btrim(p.full_name),''),'Medlem')::text
  from public.team_post_likes l
  join public.profiles p on p.id=l.profile_id
  where l.post_id=p_post_id
  order by l.created_at, l.profile_id;
end;
$$;

create or replace function public.toggle_team_post_like(p_post_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_team text; v_removed uuid;
begin
  select p.team into v_team
  from public.profiles p
  where p.id=auth.uid() and p.is_active is true and p.role in ('admin','coach','player');
  if v_team is null or not exists (
    select 1 from public.team_posts post where post.id=p_post_id and post.team=v_team
  ) then raise exception 'Not authorized'; end if;
  -- Serialize toggles from the same account on this post.
  perform pg_advisory_xact_lock(hashtextextended(p_post_id::text || auth.uid()::text, 0));
  delete from public.team_post_likes where post_id=p_post_id and profile_id=auth.uid()
  returning profile_id into v_removed;
  if v_removed is not null then return false; end if;
  insert into public.team_post_likes(post_id,profile_id) values(p_post_id,auth.uid());
  return true;
end;
$$;
revoke all on function public.team_post_likers(uuid) from public, anon;
revoke all on function public.toggle_team_post_like(uuid) from public, anon;
grant execute on function public.team_post_likers(uuid) to authenticated;
grant execute on function public.toggle_team_post_like(uuid) to authenticated;
