-- Security & stability round: roster privacy, invite-only bootstrap and private team-post images.

-- 1) Public roster: active team members get only non-sensitive fields via RPC.
drop policy if exists "active members read active players" on public.players;

create or replace function public.list_public_roster_players()
returns table (
  id uuid,
  full_name text,
  shirt_number integer,
  position text,
  team_role text,
  avatar_url text,
  public_about_me text,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.shirt_number, p.position, p.team_role,
         p.avatar_url, p.public_about_me, p.is_active
  from public.players p
  where p.is_active = true
    and public.current_profile_active()
    and public.current_profile_role() in ('admin','coach','player','parent')
  order by p.full_name;
$$;

revoke all on function public.list_public_roster_players() from public;
revoke all on function public.list_public_roster_players() from anon;
grant execute on function public.list_public_roster_players() to authenticated;

-- 2) Invite-only bootstrap: an Auth user may only be created from a pending invitation.
create or replace function public.handle_new_kronang_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.user_invitations;
  v_full_name text;
begin
  select * into v_invitation
  from public.user_invitations
  where lower(email) = lower(coalesce(new.email, ''))
    and status = 'pending'
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'A valid invitation is required before creating a Kronäng Junior account.';
  end if;

  v_full_name := coalesce(
    nullif(btrim(v_invitation.display_name), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    'Nytt konto'
  );

  insert into public.profiles (id, full_name, team, role, is_active)
  values (new.id, v_full_name, 'Kronängs IF Juniorlag', 'pending', true)
  on conflict (id) do nothing;

  update public.user_invitations
  set status = 'accepted', updated_at = now()
  where id = v_invitation.id;

  return new;
end;
$$;

-- 3) Team-post images are private. Existing public URLs are normalized to object paths.
update storage.buckets
set public = false
where id = 'team-post-images';

update public.team_posts
set image_url = regexp_replace(
  image_url,
  '^https?://[^/]+/storage/v1/object/public/team-post-images/',
  ''
)
where image_url ~ '^https?://[^/]+/storage/v1/object/public/team-post-images/';

drop policy if exists "team_post_images_select_active" on storage.objects;
create policy "team_post_images_select_active"
on storage.objects for select to authenticated
using (
  bucket_id = 'team-post-images'
  and public.current_profile_active()
);
