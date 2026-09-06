const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const workflow=fs.readFileSync('.github/workflows/home-news-tests.yml','utf8');

test('CI syntax-checks the fragile mobile bridge and profile leader tools',()=>{
  assert.match(workflow,/node --check leader-tools-profile\.js/);
  assert.match(workflow,/node --check calendar-bridge\.js/);
});

test('CI runs the critical mobile flow contract on every pull request',()=>{
  assert.match(workflow,/node --test tests\/critical-flow-contract\.test\.js/);
});
