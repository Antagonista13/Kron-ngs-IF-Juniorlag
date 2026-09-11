const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const adminEdit=fs.readFileSync('admin-player-card-edit.js','utf8');
test('direct editor path does not depend on a custom DOM event',()=>{
  assert.doesNotMatch(adminEdit,/kronang:edit-roster-player/);
  assert.match(adminEdit,/KronangPlayerRoster\.openEditorById/);
});
