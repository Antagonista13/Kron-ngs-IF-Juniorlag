-- Juniorlag 2.0: secure mobile news publishing with server-owned author identity.
alter table public.team_posts add column if not exists image_url text;
alter table public.team_posts add column if not exists author_role text;

update public.team_posts tp
set author_role = coalesce(
  (select case when p.role in ('admin','coach') then p.role else null end from public.profiles p where p.id=tp.created_by),
  'admin'
)
where author_role is null;

alter table public.team_posts alter column author_role set not null;
alter table public.team_posts drop constraint if exists team_posts_author_role_check;
alter table public.team_posts add constraint team_posts_author_role_check check (author_role in ('admin','coach'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('team-post-images','team-post-images',true,6291456,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "team_post_images_insert_manager" on storage.objects;
create policy "team_post_images_insert_manager" on storage.objects for insert to authenticated
with check (
  bucket_id='team-post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.current_profile_active()
  and public.current_profile_role() in ('admin','coach')
);

drop policy if exists "team_post_images_update_manager" on storage.objects;
create policy "team_post_images_update_manager" on storage.objects for update to authenticated
using (
  bucket_id='team-post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.current_profile_active()
  and public.current_profile_role() in ('admin','coach')
)
with check (
  bucket_id='team-post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.current_profile_active()
  and public.current_profile_role() in ('admin','coach')
);

drop policy if exists "team_post_images_delete_manager" on storage.objects;
create policy "team_post_images_delete_manager" on storage.objects for delete to authenticated
using (
  bucket_id='team-post-images'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.current_profile_active()
  and public.current_profile_role() in ('admin','coach')
);

-- Direct writes are denied. Readers keep the existing authenticated same-team SELECT policy.
drop policy if exists "role leaders insert posts" on public.team_posts;
drop policy if exists "role leaders update posts" on public.team_posts;
drop policy if exists "role leaders delete posts" on public.team_posts;

create or replace function public.leader_create_team_post(
  p_title text,
  p_body text,
  p_is_pinned boolean default false,
  p_image_url text default null
)
returns public.team_posts
language plpgsql security definer set search_path=public
as $$
declare viewer_role text; v_team text; v_row public.team_posts;
begin
  viewer_role:=public.current_profile_role();
  if not public.current_profile_active() or viewer_role not in ('admin','coach') then raise exception 'Not authorized'; end if;
  select team into v_team from public.profiles where id=auth.uid();
  if v_team is null then raise exception 'Team missing'; end if;
  if length(btrim(coalesce(p_title,'')))=0 or length(btrim(coalesce(p_body,'')))=0 then raise exception 'Title and body required'; end if;
  insert into public.team_posts(team,title,body,created_by,author_role,is_pinned,image_url)
  values(v_team,btrim(p_title),btrim(p_body),auth.uid(),viewer_role,coalesce(p_is_pinned,false),nullif(btrim(coalesce(p_image_url,'')),''))
  returning * into v_row;
  return v_row;
end;$$;

create or replace function public.leader_update_team_post(
  p_post_id uuid,
  p_title text,
  p_body text,
  p_is_pinned boolean default false,
  p_image_url text default null
)
returns public.team_posts
language plpgsql security definer set search_path=public
as $$
declare viewer_role text; v_team text; existing_author_role text; v_row public.team_posts;
begin
  viewer_role:=public.current_profile_role();
  if not public.current_profile_active() or viewer_role not in ('admin','coach') then raise exception 'Not authorized'; end if;
  select team into v_team from public.profiles where id=auth.uid();
  select author_role into existing_author_role from public.team_posts where id=p_post_id and team=v_team;
  if existing_author_role is null then raise exception 'Post not found'; end if;
  if not (viewer_role = 'admin' or (viewer_role = 'coach' and existing_author_role = 'coach')) then raise exception 'Not authorized'; end if;
  if length(btrim(coalesce(p_title,'')))=0 or length(btrim(coalesce(p_body,'')))=0 then raise exception 'Title and body required'; end if;
  update public.team_posts set title=btrim(p_title),body=btrim(p_body),is_pinned=coalesce(p_is_pinned,false),image_url=nullif(btrim(coalesce(p_image_url,'')),''),updated_at=now()
  where id=p_post_id and team=v_team returning * into v_row;
  return v_row;
end;$$;

create or replace function public.leader_delete_team_post(p_post_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
declare viewer_role text; v_team text; existing_author_role text;
begin
  viewer_role:=public.current_profile_role();
  if not public.current_profile_active() or viewer_role not in ('admin','coach') then raise exception 'Not authorized'; end if;
  select team into v_team from public.profiles where id=auth.uid();
  select author_role into existing_author_role from public.team_posts where id=p_post_id and team=v_team;
  if existing_author_role is null then raise exception 'Post not found'; end if;
  if not (viewer_role = 'admin' or (viewer_role = 'coach' and existing_author_role = 'coach')) then raise exception 'Not authorized'; end if;
  delete from public.team_posts where id=p_post_id and team=v_team;
end;$$;

revoke all on function public.leader_create_team_post(text,text,boolean,text) from public;
revoke all on function public.leader_update_team_post(uuid,text,text,boolean,text) from public;
revoke all on function public.leader_delete_team_post(uuid) from public;
revoke all on function public.leader_create_team_post(text,text,boolean,text) from anon;
revoke all on function public.leader_update_team_post(uuid,text,text,boolean,text) from anon;
revoke all on function public.leader_delete_team_post(uuid) from anon;
grant execute on function public.leader_create_team_post(text,text,boolean,text) to authenticated;
grant execute on function public.leader_update_team_post(uuid,text,text,boolean,text) to authenticated;
grant execute on function public.leader_delete_team_post(uuid) to authenticated;
