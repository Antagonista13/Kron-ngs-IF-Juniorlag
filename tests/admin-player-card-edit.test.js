const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.existsSync('admin-player-card-edit.js')?fs.readFileSync('admin-player-card-edit.js','utf8'):'';
const mirror=fs.readFileSync('admin-development-mirror.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('only admin gets edit action inside opened player card',()=>{
  assert.match(source,/function\s+canEditPlayerFromPublicCard\s*\(/);
  assert.match(source,/role\s*===\s*['"]admin['"]/);
  assert.match(source,/player-public-profile-edit/);
  assert.match(source,/TA BORT FRÅN LAGET/);
  assert.match(source,/rpc\('admin_archive_player'/);
});

test('admin edits player inline inside the open profile instead of bridging to roster form',()=>{
  assert.match(source,/function\s+openInlineEditor\s*\(/);
  assert.match(source,/selectedRosterCard\.dataset\.playerId/);
  assert.match(source,/from\('players'\)\.select\(/);
  assert.match(source,/\.eq\('id',playerId\)\.maybeSingle\(\)/);
  assert.match(source,/from\('players'\)\.update\(/);
  assert.match(source,/\.eq\('id',playerId\)/);
  assert.match(source,/player-public-profile-edit-form/);
  assert.doesNotMatch(source,/openEditorById\(/);
  assert.doesNotMatch(source,/back\.click\(\)/);
});

test('admin runtime loads the inline editor with a fresh cache version',()=>{
  assert.match(mirror,/admin-player-card-edit\.js\?v=8/);
  assert.ok(html.includes('admin-development-mirror.js?v=2'));
});

test('team page loads the admin player action module directly',()=>{
  const team=fs.readFileSync('team-page-content.js','utf8');
  assert.match(team,/admin-player-card-edit\.js\?v=12/);
  assert.match(team,/adminPlayerCardEditTeamScript/);
});

test('remove action is ensured before an existing edit action can short-circuit injection',()=>{
  const ensureIndex=source.indexOf('ensureAdminRemoveAction(profile,playerId)');
  const returnIndex=source.indexOf("if(profile.querySelector('.player-public-profile-edit'))return;");
  assert.ok(ensureIndex>=0&&returnIndex>=0&&ensureIndex<returnIndex);
});
