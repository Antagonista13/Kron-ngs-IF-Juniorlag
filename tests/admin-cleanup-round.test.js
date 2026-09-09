const fs=require('fs');
const assert=require('assert');

const admin=fs.readFileSync('admin-page.js','utf8');
const sync=fs.readFileSync('sportadmin-sync-admin.js','utf8');
const edge=fs.readFileSync('supabase/functions/sportadmin-roster-sync/index.ts','utf8');

assert.match(admin,/SPELARE/,'admin users should be grouped under SPELARE');
assert.match(admin,/STAB/,'admin users should be grouped under STAB');
assert.match(admin,/data-action=["']delete["']/,'non-admin user cards should expose a delete action');
assert.match(admin,/admin_delete_user/,'delete action should use an admin-only server RPC');
assert.match(admin,/confirm\(/,'deleting an account should require confirmation');
assert.doesNotMatch(sync,/data-sportadmin-sync[^>]*>UPPDATERA/,'legacy SportAdmin card must not expose a second manual sync button');
assert.match(edge,/missing|removed|absent/i,'SportAdmin sync should detect players no longer present in SportAdmin');
assert.match(edge,/sportadmin.*presence|presence.*sportadmin/i,'SportAdmin absence should be recorded for admin review');

console.log('Admin cleanup round tests passed');
