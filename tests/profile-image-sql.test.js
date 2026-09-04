const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040015_admin_profile_images.sql';

test('profile image migration adds avatar storage and admin assignment rpcs',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/add column if not exists avatar_url text/);
 assert.match(sql,/insert into storage\.buckets/);
 assert.match(sql,/profile-images/);
 assert.match(sql,/admin_assign_profile_image/);
 assert.match(sql,/admin_assign_staff_image/);
 assert.match(sql,/current_profile_role\(\) <> 'admin'/);
 assert.match(sql,/from anon/);
});

test('profile image bucket is private with authenticated read and admin-only writes',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/false/);
 assert.match(sql,/for select/);
 assert.match(sql,/for insert/);
 assert.match(sql,/for update/);
 assert.match(sql,/for delete/);
 assert.match(sql,/current_profile_role\(\) = 'admin'/);
});
