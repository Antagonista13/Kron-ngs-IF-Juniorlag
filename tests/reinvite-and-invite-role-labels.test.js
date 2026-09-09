const fs=require('fs');
const assert=require('assert');

const html=fs.readFileSync('index.html','utf8');
const sql=fs.readFileSync('supabase/migrations/202609090005_admin_account_delete_and_sportadmin_presence.sql','utf8');

assert.match(html,/Kontotyp/,'invite form should call the access role Kontotyp');
assert.match(html,/Funktion i laget/,'leader invitations should have a separate team function field');
assert.match(sql,/user_invitations[\s\S]*delete/i,'deleting an app account should clear its old invitation so the email can be invited again');

console.log('Reinvite and invite role label tests passed');
