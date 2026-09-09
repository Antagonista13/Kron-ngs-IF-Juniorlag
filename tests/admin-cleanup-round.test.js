const fs=require('fs');
const assert=require('assert');

const admin=fs.readFileSync('admin-user-management.js','utf8');
const sync=fs.readFileSync('sportadmin-sync-admin.js','utf8');
const edge=fs.readFileSync('supabase/functions/sportadmin-roster-sync/index.ts','utf8');
const sql=fs.readFileSync('supabase/migrations/202609090005_admin_account_delete_and_sportadmin_presence.sql','utf8');

assert.match(admin,/SPELARE/,'admin users should be grouped under SPELARE');
assert.match(admin,/STAB/,'admin users should be grouped under STAB');
assert.match(admin,/data-action=["']delete["']/,'non-admin user cards should expose a delete action');
assert.match(admin,/admin_delete_user/,'delete action should use an admin-only server RPC');
assert.match(admin,/confirm\(/,'deleting an account should require confirmation');
assert.match(sql,/p_profile_id = auth\.uid\(\)/,'own admin account must be protected server-side');
assert.doesNotMatch(sync,/data-sportadmin-sync[^>]*>UPPDATERA/,'legacy SportAdmin card must not expose a second manual sync button');
assert.match(sync,/TA BORT FRÅN LAGET/);
assert.match(sync,/BEHÅLL/);
assert.match(edge,/state:'missing'/,'SportAdmin sync should detect players no longer present in SportAdmin');
assert.match(edge,/sportadmin_player_presence/,'SportAdmin absence should be recorded for admin review');

console.log('Admin cleanup round tests passed');
