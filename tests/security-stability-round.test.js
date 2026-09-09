const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
function read(path){return fs.existsSync(path)?fs.readFileSync(path,'utf8'):'';}

const migration=read('supabase/migrations/202609090001_security_stability_round.sql');
const roster=read('player-roster.js');
const invite=read('supabase/functions/invite-user/index.ts');
const posts=read('team-posts.js');
const sync=read('supabase/functions/sportadmin-roster-sync/index.ts');
const schedule=read('.github/workflows/sportadmin-roster-daily.yml');

test('player and parent roster reads use a public-field RPC only',()=>{
  assert.match(migration,/list_public_roster_players/i);
  const rpcBlock=(migration.match(/returns table\s*\([\s\S]*?\)\s*language/i)||[])[0]||'';
  assert.doesNotMatch(rpcBlock,/mobile_phone|birth_date/i);
  assert.match(migration,/drop policy if exists "active members read active players"/i);
  assert.match(roster,/rpc\(['"]list_public_roster_players['"]\)/i);
});

test('account bootstrap is invitation-backed on the server',()=>{
  assert.match(migration,/handle_new_kronang_user/i);
  assert.match(migration,/user_invitations/i);
  assert.match(migration,/raise exception[^;]*invit/i);
  assert.match(migration,/status\s*=\s*'accepted'/i);
  const metadata=invite.indexOf("from('user_invitations').insert");
  const authInvite=invite.indexOf('inviteUserByEmail');
  assert.ok(metadata>=0&&authInvite>=0&&metadata<authInvite,'invitation metadata must exist before Auth invite');
});

test('team-post images are private and displayed with signed URLs',()=>{
  assert.match(migration,/team-post-images[\s\S]*public\s*=\s*false/i);
  assert.match(migration,/team_post_images_select_active/i);
  assert.match(posts,/createSignedUrl/i);
  assert.doesNotMatch(posts,/getPublicUrl\(/i);
  assert.match(posts,/return\s+path\s*;/i);
});

test('SportAdmin scheduled sync no longer trusts a publishable key',()=>{
  assert.match(sync,/Deno\.env\.get\(['"]SPORTADMIN_SYNC_KEY['"]\)/);
  assert.doesNotMatch(sync,/const\s+SYNC_KEY\s*=\s*["']sb_publishable_/i);
  assert.match(schedule,/secrets\.KRONANG_SPORTADMIN_SYNC_KEY/);
  assert.doesNotMatch(schedule,/open\(['"]auth\.js/i);
});
