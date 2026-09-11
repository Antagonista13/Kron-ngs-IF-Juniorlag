const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const adminEdit=fs.readFileSync('admin-player-card-edit.js','utf8');
const roster=fs.readFileSync('player-roster.js','utf8');

test('admin player edit calls the roster editor API directly by player id',()=>{
  assert.match(roster,/dataset\.playerId\s*=\s*p\.id/);
  assert.match(roster,/KronangPlayerRoster/);
  assert.match(roster,/openEditorById/);
  assert.match(adminEdit,/selectedRosterCard\.dataset\.playerId/);
  assert.match(adminEdit,/KronangPlayerRoster\.openEditorById/);
  assert.doesNotMatch(adminEdit,/new CustomEvent\(['"]kronang:edit-roster-player['"]/);
  assert.doesNotMatch(adminEdit,/dispatchEvent\(/);
});
