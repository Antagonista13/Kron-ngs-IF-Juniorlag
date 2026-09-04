-- Juniorlag 2.0: Admin-only profile and staff image management.
alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets(id,name,public,file_size_limit)
values('profile-images','profile-images',false,8388608)
on conflict(id) do update set public=false,file_size_limit=8388608;

-- Authenticated active team members may resolve private profile images.
drop policy if exists "profile images readable by active users" on storage.objects;
create policy "profile images readable by active users"
on storage.objects for select to authenticated
using (bucket_id='profile-images' and public.current_profile_status()='active');

-- Only active Admin may upload/replace/remove objects.
drop policy if exists "profile images inserted by admin" on storage.objects;
create policy "profile images inserted by admin"
on storage.objects for insert to authenticated
with check (bucket_id='profile-images' and public.current_profile_role()='admin' and public.current_profile_status()='active');

drop policy if exists "profile images updated by admin" on storage.objects;
create policy "profile images updated by admin"
on storage.objects for update to authenticated
using (bucket_id='profile-images' and public.current_profile_role()='admin' and public.current_profile_status()='active')
with check (bucket_id='profile-images' and public.current_profile_role()='admin' and public.current_profile_status()='active');

drop policy if exists "profile images deleted by admin" on storage.objects;
create policy "profile images deleted by admin"
on storage.objects for delete to authenticated
using (bucket_id='profile-images' and public.current_profile_role()='admin' and public.current_profile_status()='active');

create or replace function public.admin_assign_profile_image(p_profile_id uuid,p_object_path text)
returns void language plpgsql security definer set search_path=public as $$
declare v_team text;
begin
 if public.current_profile_role() <> 'admin' or public.current_profile_status() <> 'active' then raise exception 'Not authorized'; end if;
 select team into v_team from public.profiles where id=auth.uid();
 update public.profiles set avatar_url=nullif(btrim(coalesce(p_object_path,'')),'')
 where id=p_profile_id and team=v_team;
 if not found then raise exception 'Profile not found'; end if;
end;$$;

create or replace function public.admin_assign_staff_image(p_staff_id bigint,p_object_path text)
returns void language plpgsql security definer set search_path=public as $$
declare v_team text;
begin
 if public.current_profile_role() <> 'admin' or public.current_profile_status() <> 'active' then raise exception 'Not authorized'; end if;
 select team into v_team from public.profiles where id=auth.uid();
 update public.team_staff set avatar_url=nullif(btrim(coalesce(p_object_path,'')),''),updated_at=now()
 where id=p_staff_id and team=v_team and is_active=true;
 if not found then raise exception 'Staff member not found'; end if;
end;$$;

revoke all on function public.admin_assign_profile_image(uuid,text) from public;
revoke all on function public.admin_assign_staff_image(bigint,text) from public;
revoke all on function public.admin_assign_profile_image(uuid,text) from anon;
revoke all on function public.admin_assign_staff_image(bigint,text) from anon;
grant execute on function public.admin_assign_profile_image(uuid,text) to authenticated;
grant execute on function public.admin_assign_staff_image(bigint,text) to authenticated;
