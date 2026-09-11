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

test('admin player card calls the roster editor API directly by player id',()=>{
  assert.match(roster,/dataset\.playerId\s*=\s*p\.id/);
  assert.match(roster,/KronangPlayerRoster/);
  assert.match(roster,/openEditorById/);
  assert.match(source,/selectedRosterCard\.dataset\.playerId/);
  assert.match(source,/KronangPlayerRoster/);
  assert.match(source,/openEditorById\(playerId\)/);
  assert.doesNotMatch(source,/new CustomEvent\(['"]kronang:edit-roster-player['"]/);
  assert.doesNotMatch(source,/dispatchEvent\(/);
  assert.doesNotMatch(source,/rosterEdit\.click\(\)/);
});

test('admin runtime loads the bumped player-card edit module',()=>{
  assert.match(mirror,/admin-player-card-edit\.js\?v=6/);
  assert.match(mirror,/ensureAdminPlayerCardEditModule/);
  assert.ok(html.includes('admin-development-mirror.js?v=2'));
  assert.ok(html.includes('player-roster.js?v=10'));
});
