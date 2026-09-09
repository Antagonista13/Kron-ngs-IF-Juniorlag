const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const sql=fs.readFileSync('supabase/migrations/202609090006_reinvite_and_invite_team_function.sql','utf8');
const edge=fs.readFileSync('supabase/functions/invite-user/index.ts','utf8');
const admin=fs.readFileSync('admin-page.js','utf8');

assert.match(html,/Kontotyp/,'invite form should call the access role Kontotyp');
assert.match(html,/Funktion i laget/,'leader invitations should have a separate team function field');
assert.match(sql,/delete from public\.user_invitations where lower\(email\) = lower\(v_email\)/i,'deleting an app account should clear its old invitation so the email can be invited again');
assert.match(sql,/team_function text/i,'invitation should store leader team function');
assert.match(edge,/teamFunction/,'invite function should accept leader team function');
assert.match(admin,/adminInviteFunction/,'admin form should send leader team function');

console.log('Reinvite and invite role label tests passed');
