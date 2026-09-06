const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040016_admin_profile_images.sql';
const syncPath='supabase/migrations/202609060001_sync_profile_image_to_linked_player.sql';

test('profile image migration adds avatar storage and admin assignment rpcs',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/add column if not exists avatar_url text/);
 assert.match(sql,/insert into storage\.buckets/);
 assert.match(sql,/profile-images/);
 assert.match(sql,/admin_assign_profile_image/);
 assert.match(sql,/admin_assign_staff_image/);
 assert.match(sql,/current_profile_role\(\) <> 'admin'/);
 assert.match(sql,/current_profile_active\(\)/);
 assert.match(sql,/from anon/);
});

test('profile image bucket is private with authenticated read and admin-only writes',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/false/);
 assert.match(sql,/for select/);
 assert.match(sql,/for insert/);
 assert.match(sql,/for update/);
 assert.match(sql,/for delete/);
 assert.match(sql,/current_profile_role\(\)\s*=\s*'admin'/);
 assert.match(sql,/current_profile_active\(\)/);
});

test('assigning an account profile image also updates its linked roster player',()=>{
 const sql=fs.readFileSync(syncPath,'utf8').toLowerCase();
 assert.match(sql,/create or replace function public\.admin_assign_profile_image/);
 assert.match(sql,/v_path text := nullif/);
 assert.match(sql,/update public\.players/);
 assert.match(sql,/set avatar_url=v_path/);
 assert.match(sql,/where profile_id\s*=\s*p_profile_id/);
});
