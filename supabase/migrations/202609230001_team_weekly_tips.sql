create table if not exists public.team_weekly_tips (
  team text primary key,
  title text not null,
  body text not null default '',
  image_path text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.team_weekly_tips enable row level security;
grant select, insert, update, delete on public.team_weekly_tips to authenticated;

drop policy if exists "team weekly tips readable by team" on public.team_weekly_tips;\ncreate policy "team weekly tips readable by team" on public.team_weekly_tips for select to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=team_weekly_tips.team and p.role in ('admin','coach','player')));
drop policy if exists "admins insert team weekly tips" on public.team_weekly_tips;\ncreate policy "admins insert team weekly tips" on public.team_weekly_tips for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=team_weekly_tips.team and p.role='admin'));
drop policy if exists "admins update team weekly tips" on public.team_weekly_tips;\ncreate policy "admins update team weekly tips" on public.team_weekly_tips for update to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=team_weekly_tips.team and p.role='admin'))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=team_weekly_tips.team and p.role='admin'));
drop policy if exists "admins delete team weekly tips" on public.team_weekly_tips;\ncreate policy "admins delete team weekly tips" on public.team_weekly_tips for delete to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=team_weekly_tips.team and p.role='admin'));

insert into storage.buckets(id,name,public) values('weekly-tips','weekly-tips',false) on conflict(id) do update set public=false;

drop policy if exists "team weekly tip images readable by team" on storage.objects;\ncreate policy "team weekly tip images readable by team" on storage.objects for select to authenticated
using (bucket_id='weekly-tips' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=split_part(name,'/',1) and p.role in ('admin','coach','player')));
drop policy if exists "admins upload weekly tip images" on storage.objects;\ncreate policy "admins upload weekly tip images" on storage.objects for insert to authenticated
with check (bucket_id='weekly-tips' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=split_part(name,'/',1) and p.role='admin'));
drop policy if exists "admins update weekly tip images" on storage.objects;\ncreate policy "admins update weekly tip images" on storage.objects for update to authenticated
using (bucket_id='weekly-tips' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=split_part(name,'/',1) and p.role='admin'))
with check (bucket_id='weekly-tips' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=split_part(name,'/',1) and p.role='admin'));
drop policy if exists "admins delete weekly tip images" on storage.objects;\ncreate policy "admins delete weekly tip images" on storage.objects for delete to authenticated
using (bucket_id='weekly-tips' and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active is distinct from false and p.team=split_part(name,'/',1) and p.role='admin'));