-- Allow central roster players to have profile images even before an app account is linked.
alter table public.players add column if not exists avatar_url text;

create or replace function public.admin_assign_player_image(p_player_id uuid,p_object_path text)
returns void language plpgsql security definer set search_path=public as $$
declare v_profile_id uuid;
begin
 if public.current_profile_role() <> 'admin' or not public.current_profile_active() then raise exception 'Not authorized'; end if;
 update public.players set avatar_url=nullif(btrim(coalesce(p_object_path,'')),''),updated_at=now()
 where id=p_player_id
 returning profile_id into v_profile_id;
 if not found then raise exception 'Player not found'; end if;
 if v_profile_id is not null then
   update public.profiles set avatar_url=nullif(btrim(coalesce(p_object_path,'')),'') where id=v_profile_id;
 end if;
end;$$;

revoke all on function public.admin_assign_player_image(uuid,text) from public;
revoke all on function public.admin_assign_player_image(uuid,text) from anon;
grant execute on function public.admin_assign_player_image(uuid,text) to authenticated;
