const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.existsSync('admin-player-card-edit.js')?fs.readFileSync('admin-player-card-edit.js','utf8'):'';
const html=fs.readFileSync('index.html','utf8');

test('only admin gets edit action inside opened player card',()=>{
  assert.match(source,/function\s+canEditPlayerFromPublicCard\s*\(/);
  assert.match(source,/role\s*===\s*['"]admin['"]/);
  assert.match(source,/player-public-profile-edit/);
  assert.match(source,/\.player-public-profile-back/);
  assert.match(source,/Redigera/);
});

test('admin player-card edit module is loaded after roster module',()=>{
  const roster=html.indexOf('player-roster.js?v=7');
  const edit=html.indexOf('admin-player-card-edit.js?v=1');
  assert.ok(roster>=0);
  assert.ok(edit>roster);
});
