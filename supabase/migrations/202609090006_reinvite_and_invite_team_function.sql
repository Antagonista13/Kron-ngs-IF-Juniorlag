-- Allow deleted app accounts to be invited again and carry leader function from invitation.

alter table public.user_invitations
  add column if not exists team_function text;

create or replace function public.admin_delete_user(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_email text;
begin
  if not public.is_admin() then raise exception 'Endast Admin kan radera användarkonton.'; end if;
  if p_profile_id = auth.uid() then raise exception 'Du kan inte radera ditt eget adminkonto.'; end if;
  select role into v_role from public.profiles where id = p_profile_id for update;
  if not found then raise exception 'Användaren saknar profil.'; end if;
  if v_role = 'admin' then raise exception 'Adminkonton kan inte raderas här.'; end if;

  select email into v_email from auth.users where id = p_profile_id;
  update public.players set profile_id = null, updated_at = now() where profile_id = p_profile_id;
  delete from auth.users where id = p_profile_id;
  if v_email is not null then
    delete from public.user_invitations where lower(email) = lower(v_email);
  end if;
end;
$$;

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

  v_full_name := coalesce(nullif(btrim(v_invitation.display_name), ''), nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Nytt konto');

  insert into public.profiles (id, full_name, team, role, is_active, display_title)
  values (new.id, v_full_name, 'Kronängs IF Juniorlag', 'pending', true,
    case when v_invitation.expected_role = 'coach' then nullif(btrim(v_invitation.team_function), '') else null end)
  on conflict (id) do nothing;

  update public.user_invitations set status = 'accepted', updated_at = now() where id = v_invitation.id;
  return new;
end;
$$;
