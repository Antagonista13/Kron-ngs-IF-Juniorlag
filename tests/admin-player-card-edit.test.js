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

test('admin player card fetches player by id and only then closes profile',()=>{
  assert.match(roster,/openEditorById\s*:\s*async function\(playerId\)/);
  assert.match(roster,/from\('players'\)\.select\(/);
  assert.match(roster,/\.eq\('id',playerId\)\.maybeSingle\(\)/);
  assert.match(source,/selectedRosterCard\.dataset\.playerId/);
  assert.match(source,/await\s+rosterApi\.openEditorById\(playerId\)/);
  const openCall=source.indexOf('await rosterApi.openEditorById(playerId)');
  const backCall=source.indexOf('back.click()');
  assert.ok(openCall>=0&&backCall>openCall);
  assert.doesNotMatch(source,/new CustomEvent\(['"]kronang:edit-roster-player['"]/);
  assert.doesNotMatch(source,/dispatchEvent\(/);
});

test('admin runtime loads bumped editor assets',()=>{
  assert.match(mirror,/admin-player-card-edit\.js\?v=7/);
  assert.ok(html.includes('player-roster.js?v=11'));
});
