const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('coach-development-worklist.js','utf8');
const css=fs.readFileSync('coach-roster-summary.css','utf8');

test('development player cards stay clean while keeping follow-up status',()=>{
  assert.match(src,/development-player-card/);
  assert.match(src,/coach-follow-up-due/);
  assert.doesNotMatch(src,/>Mål: /);
  assert.doesNotMatch(src,/>Fokus: /);
  assert.doesNotMatch(src,/>Senast uppföljd: /);
});

test('click replaces the long worklist with the selected player profile',()=>{
  const hide=src.indexOf('host.hidden=true');
  const profile=src.indexOf("profileContainer.className='development-selected-profile'");
  const open=src.indexOf('await root.KronangDevelopmentProfile.openPlayerDevelopmentWorkflow({container:profileContainer');
  assert.ok(hide>=0,'worklist must be hidden immediately');
  assert.ok(profile>hide,'visible profile container must be created after hiding worklist');
  assert.ok(open>profile,'selected profile must load into the visible container');
  assert.match(src,/development-back-to-list/);
});

test('development player card has explicit interactive styling',()=>{
  assert.match(css,/\.development-player-card\s*\{/);
  assert.match(css,/cursor:pointer/);
  assert.match(css,/width:100%/);
});
