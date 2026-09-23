drop policy if exists "team weekly tip images readable by team" on storage.objects;
create policy "team weekly tip images readable by team"
on storage.objects for select
to authenticated
using (
  bucket_id = 'weekly-tips'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active is distinct from false
      and btrim(regexp_replace(translate(lower(p.team),'åäö','aao'),'[^a-z0-9_-]+','-','g'),'-') = split_part(name,'/',1)
      and p.role in ('admin','coach','player')
  )
);

drop policy if exists "admins upload weekly tip images" on storage.objects;
create policy "admins upload weekly tip images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'weekly-tips'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active is distinct from false
      and btrim(regexp_replace(translate(lower(p.team),'åäö','aao'),'[^a-z0-9_-]+','-','g'),'-') = split_part(name,'/',1)
      and p.role = 'admin'
  )
);

drop policy if exists "admins update weekly tip images" on storage.objects;
create policy "admins update weekly tip images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'weekly-tips'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active is distinct from false
      and btrim(regexp_replace(translate(lower(p.team),'åäö','aao'),'[^a-z0-9_-]+','-','g'),'-') = split_part(name,'/',1)
      and p.role = 'admin'
  )
)
with check (
  bucket_id = 'weekly-tips'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active is distinct from false
      and btrim(regexp_replace(translate(lower(p.team),'åäö','aao'),'[^a-z0-9_-]+','-','g'),'-') = split_part(name,'/',1)
      and p.role = 'admin'
  )
);

drop policy if exists "admins delete weekly tip images" on storage.objects;
create policy "admins delete weekly tip images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'weekly-tips'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.is_active is distinct from false
      and btrim(regexp_replace(translate(lower(p.team),'åäö','aao'),'[^a-z0-9_-]+','-','g'),'-') = split_part(name,'/',1)
      and p.role = 'admin'
  )
);
