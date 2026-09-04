const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040018_team_posts_editor_permissions.sql';

test('news migration preserves server-controlled author metadata',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/add column if not exists author_role text/);
 assert.match(sql,/created_by/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/current_profile_role\(\)/);
});

test('news writes are forced through secure rpc hierarchy',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 for(const fn of ['leader_create_team_post','leader_update_team_post','leader_delete_team_post']) assert.match(sql,new RegExp(fn));
 assert.match(sql,/viewer_role = 'admin'/);
 assert.match(sql,/viewer_role = 'coach'.*author_role = 'coach'/s);
 assert.match(sql,/revoke all on function public\.leader_/);
 assert.match(sql,/from anon/);
 assert.match(sql,/grant execute on function public\.leader_/);
});

test('existing image system is completed rather than duplicated',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/add column if not exists image_url text/);
 assert.match(sql,/team-post-images/);
 assert.doesNotMatch(sql,/create bucket .*news/i);
});
