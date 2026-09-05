const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040017_player_profile_images.sql';
const lockPath='supabase/migrations/202609050001_lock_player_avatar_admin.sql';

test('central roster players can have admin-managed profile images without accounts',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/alter table public\.players add column if not exists avatar_url text/);
 assert.match(sql,/admin_assign_player_image/);
 assert.match(sql,/current_profile_role\(\) <> 'admin'/);
 assert.match(sql,/not public\.current_profile_active\(\)/);
 assert.match(sql,/from anon/);
 assert.match(sql,/profile_id/);
});

test('direct player avatar writes are blocked for non-admin leaders',()=>{
 const sql=fs.readFileSync(lockPath,'utf8').toLowerCase();
 assert.match(sql,/create or replace function public\.enforce_admin_player_avatar/);
 assert.match(sql,/before insert or update of avatar_url on public\.players/);
 assert.match(sql,/current_profile_role\(\) <> 'admin'/);
 assert.match(sql,/new\.avatar_url is distinct from old\.avatar_url/);
 assert.match(sql,/raise exception 'not authorized'/);
});
