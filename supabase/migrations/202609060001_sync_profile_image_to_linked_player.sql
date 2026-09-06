-- Keep account profile images and linked roster player images in sync.
-- The Administration profile-image tool writes to profiles; the roster reads players.avatar_url.

create or replace function public.admin_assign_profile_image(p_profile_id uuid,p_object_path text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  v_team text;
  v_path text := nullif(btrim(coalesce(p_object_path,'')),'');
begin
  if public.current_profile_role() <> 'admin' or not public.current_profile_active() then
    raise exception 'Not authorized';
  end if;

  select team into v_team from public.profiles where id=auth.uid();

  update public.profiles
     set avatar_url=v_path
   where id=p_profile_id and team=v_team;
  if not found then raise exception 'Profile not found'; end if;

  update public.players
     set avatar_url=v_path,
         updated_at=now()
   where profile_id=p_profile_id;
end;
$$;

revoke all on function public.admin_assign_profile_image(uuid,text) from public;
revoke all on function public.admin_assign_profile_image(uuid,text) from anon;
grant execute on function public.admin_assign_profile_image(uuid,text) to authenticated;

-- Repair already-linked players whose account image was saved before this sync existed.
alter table public.players disable trigger enforce_admin_player_avatar;
update public.players p
   set avatar_url=pr.avatar_url,
       updated_at=now()
  from public.profiles pr
 where p.profile_id=pr.id
   and pr.avatar_url is not null
   and p.avatar_url is distinct from pr.avatar_url;
alter table public.players enable trigger enforce_admin_player_avatar;
