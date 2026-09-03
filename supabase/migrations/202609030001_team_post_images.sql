alter table public.team_posts
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-post-images',
  'team-post-images',
  true,
  6291456,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "team_post_images_insert_manager" on storage.objects;
create policy "team_post_images_insert_manager"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'team-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('coach','admin')
  )
);

drop policy if exists "team_post_images_update_manager" on storage.objects;
create policy "team_post_images_update_manager"
on storage.objects for update to authenticated
using (
  bucket_id = 'team-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('coach','admin')
  )
)
with check (
  bucket_id = 'team-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "team_post_images_delete_manager" on storage.objects;
create policy "team_post_images_delete_manager"
on storage.objects for delete to authenticated
using (
  bucket_id = 'team-post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('coach','admin')
  )
);
