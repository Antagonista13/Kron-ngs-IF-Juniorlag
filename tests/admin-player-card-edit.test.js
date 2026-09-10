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
  assert.match(source,/\.player-public-profile-back/);
  assert.match(source,/back\.click\(\)/);
  assert.match(source,/rosterEdit\.click\(\)/);
  assert.match(source,/\.player-roster-form/);
  assert.match(source,/scrollIntoView/);
  assert.match(source,/back\.click\(\)[\s\S]{0,500}rosterEdit\.click\(\)/);
});

test('admin runtime loads the bumped player-card edit module',()=>{
  assert.match(mirror,/admin-player-card-edit\.js\?v=3/);
  assert.match(mirror,/ensureAdminPlayerCardEditModule/);
  assert.ok(html.includes('admin-development-mirror.js?v=2'));
});
