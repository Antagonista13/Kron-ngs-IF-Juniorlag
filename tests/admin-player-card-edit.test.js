const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.existsSync('admin-player-card-edit.js')?fs.readFileSync('admin-player-card-edit.js','utf8'):'';
const roster=fs.readFileSync('player-roster.js','utf8');
const mirror=fs.readFileSync('admin-development-mirror.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('only admin gets edit action inside opened player card',()=>{
  assert.match(source,/function\s+canEditPlayerFromPublicCard\s*\(/);
  assert.match(source,/role\s*===\s*['"]admin['"]/);
  assert.match(source,/player-public-profile-edit/);
});

test('admin player card uses direct roster edit bridge instead of replaying hidden button clicks',()=>{
  assert.match(roster,/kronang:edit-roster-player/);
  assert.match(roster,/addEventListener\(['"]kronang:edit-roster-player['"]/);
  assert.match(source,/new CustomEvent\(['"]kronang:edit-roster-player['"]/);
  assert.match(source,/dispatchEvent\(/);
  assert.doesNotMatch(source,/rosterEdit\.click\(\)/);
  assert.doesNotMatch(source,/setTimeout\s*\(\s*function\s*\(\)\s*\{[\s\S]{0,500}rosterEdit\.click\(\)/);
});

test('admin runtime loads the bumped player-card edit module',()=>{
  assert.match(mirror,/admin-player-card-edit\.js\?v=5/);
  assert.match(mirror,/ensureAdminPlayerCardEditModule/);
  assert.ok(html.includes('admin-development-mirror.js?v=2'));
});
