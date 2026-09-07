const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('history selection is stateful across DOM updates',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/let activeHistory='goal'/);
  assert.match(layout,/activeHistory=kind/);
  assert.match(layout,/showHistory\(activeHistory\)/);
  assert.match(layout,/el\.hidden=name!==activeHistory/);
});
