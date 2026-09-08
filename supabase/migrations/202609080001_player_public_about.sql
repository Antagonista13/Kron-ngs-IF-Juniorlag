alter table public.players
  add column if not exists public_about_me text;

create or replace function public.save_my_public_about(p_about text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
     set public_about_me = nullif(left(trim(coalesce(p_about,'')), 500), '')
   where profile_id = auth.uid()
     and is_active = true;

  if not found then
    raise exception 'Ingen aktiv spelarprofil är kopplad till kontot.';
  end if;
end;
$$;

revoke all on function public.save_my_public_about(text) from public;
grant execute on function public.save_my_public_about(text) to authenticated;
