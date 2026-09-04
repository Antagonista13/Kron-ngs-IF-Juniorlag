const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040017_player_profile_images.sql';

test('central roster players can have admin-managed profile images without accounts',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/alter table public\.players add column if not exists avatar_url text/);
 assert.match(sql,/admin_assign_player_image/);
 assert.match(sql,/current_profile_role\(\) <> 'admin'/);
 assert.match(sql,/not public\.current_profile_active\(\)/);
 assert.match(sql,/from anon/);
 assert.match(sql,/profile_id/);
});
