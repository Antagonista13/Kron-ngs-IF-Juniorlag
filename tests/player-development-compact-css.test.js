const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('compact player development reduces card spacing and styles selected history tab',()=>{
  const css=fs.readFileSync('player-development-compact.css','utf8');
  assert.match(css,/player-development-compact/);
  assert.match(css,/development-card\{padding:16px 18px/);
  assert.match(css,/player-history-tabs button\[aria-selected="true"\]/);
  assert.match(css,/@media\(max-width:560px\)/);
});
