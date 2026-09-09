const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');

const sql=fs.readFileSync('supabase/migrations/202609090003_admincenter_sync_runs.sql','utf8');

test('Admincenter migration creates operational sync history only',()=>{
  assert.match(sql,/create table(?: if not exists)? public\.sportadmin_sync_runs/i);
  for(const column of ['id','started_at','finished_at','status','found','imported','source','error_message','triggered_by']){
    assert.match(sql,new RegExp('\\b'+column+'\\b','i'));
  }
  assert.match(sql,/status[^\n]*(success|failure)/i);
  assert.match(sql,/triggered_by[^\n]*(scheduled|admin)/i);
});

test('sync history is protected by RLS and active-admin read policy',()=>{
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/create policy[^;]*sportadmin_sync_runs[^;]*select/i);
  assert.match(sql,/profiles/i);
  assert.match(sql,/role\s*=\s*'admin'/i);
  assert.match(sql,/is_active\s*=\s*true/i);
  assert.match(sql,/revoke\s+(insert|update|delete|all)[^;]*authenticated/i);
  assert.match(sql,/revoke\s+(insert|update|delete|all)[^;]*anon/i);
});
