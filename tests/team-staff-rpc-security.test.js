const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='supabase/migrations/202609040014_lock_down_team_staff_rpcs.sql';

test('team staff security migration revokes anonymous execute',()=>{
 const sql=fs.readFileSync(path,'utf8').toLowerCase();
 for(const fn of ['admin_save_team_staff','admin_remove_team_staff','admin_reorder_team_staff']){
  assert.match(sql,new RegExp(`revoke all on function public\\.${fn}[^;]+ from anon`));
 }
});
