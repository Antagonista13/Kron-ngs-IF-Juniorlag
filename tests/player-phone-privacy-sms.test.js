const fs = require('fs');
const assert = require('assert');

const migrationPath = 'supabase/migrations/202609090010_player_phone_privacy.sql';
assert.ok(fs.existsSync(migrationPath), 'player phone privacy migration must exist');
const migration = fs.readFileSync(migrationPath, 'utf8');
assert.ok(/player_contact_preferences/i.test(migration), 'contact preference storage must exist');
assert.ok(/hidden|coaches|team/i.test(migration), 'three phone visibility options must exist');
assert.ok(/row level security/i.test(migration), 'phone data must be protected by RLS');
assert.ok(/role\s*=\s*'admin'|role='admin'/i.test(migration), 'admin must retain access');
assert.ok(/update_my_phone_visibility/i.test(migration), 'player must be able to update own visibility');
assert.ok(/get_visible_player_phone/i.test(migration), 'phone visibility must be resolved server-side');

const sync = fs.readFileSync('supabase/functions/sportadmin-roster-sync/index.ts', 'utf8');
assert.ok(/mobile|mobil|phone/i.test(sync), 'SportAdmin sync must extract player mobile number');
assert.ok(/player_contact_preferences/i.test(sync), 'SportAdmin mobile number must be stored in protected contact data');
assert.equal(/email|guardian|parent/i.test(sync), false, 'SportAdmin sync must still avoid unrelated personal details');

const smsPath = 'supabase/functions/create-player-sms-invite/index.ts';
assert.ok(fs.existsSync(smsPath), 'SMS invite Edge Function must exist');
const sms = fs.readFileSync(smsPath, 'utf8');
assert.ok(sms.includes('Authorization'), 'SMS invite must require Authorization');
assert.ok(sms.includes("role !== 'admin'"), 'SMS invite caller must be admin');
assert.ok(/generateLink/i.test(sms), 'SMS invite must generate an auth link without sending email');
assert.ok(/player_contact_preferences/i.test(sms), 'SMS invite must use protected player phone data');

const ui = fs.readFileSync('admin-page.js', 'utf8');
assert.ok(/Bjud in via SMS/i.test(ui), 'admin must get an SMS invite action for players');
assert.ok(/sms:/i.test(ui), 'admin SMS action must open the device SMS composer');

const profile = fs.readFileSync('profile-role-view.js', 'utf8');
assert.ok(/Vem får se mitt mobilnummer/i.test(profile), 'player profile must expose phone visibility setting');
assert.ok(/Dolt/i.test(profile) && /Endast tränare/i.test(profile) && /Alla i laget/i.test(profile), 'player must get all three visibility choices');

console.log('player phone privacy and SMS invite contract ok');
