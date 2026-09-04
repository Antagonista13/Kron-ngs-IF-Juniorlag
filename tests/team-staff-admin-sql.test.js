const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040013_team_staff_admin_management.sql';

test('staff migration creates the presentation table if earlier manual sql was never applied',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/create table if not exists public\.team_staff/);
 assert.match(sql,/alter table public\.team_staff enable row level security/);
 assert.match(sql,/same team/);
});

test('staff management migration keeps presentation staff independent from accounts',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 assert.match(sql,/description text/);
 assert.doesNotMatch(sql,/profile_id\s+uuid\s+not null/);
 assert.match(sql,/sort_order/);
});

test('only active admin can mutate staff through secure rpcs',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 for(const fn of ['admin_save_team_staff','admin_remove_team_staff','admin_reorder_team_staff']) assert.match(sql,new RegExp(fn));
 assert.match(sql,/current_profile_role\(\) <> 'admin'/);
 assert.match(sql,/not public\.current_profile_active\(\)/);
 assert.doesNotMatch(sql,/current_profile_status/);
 assert.match(sql,/revoke all on function public\.admin_/);
 assert.match(sql,/grant execute on function public\.admin_/);
});
