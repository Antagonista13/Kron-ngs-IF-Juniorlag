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
  const detailMode=src.indexOf("coachView.classList.add('coach-player-detail-open')");
  const hide=src.indexOf('host.hidden=true');
  const profile=src.indexOf("profileContainer.className='development-selected-profile'");
  const open=src.indexOf('await root.KronangDevelopmentProfile.openPlayerDevelopmentWorkflow({container:profileContainer');
  assert.ok(detailMode>=0,'coach detail mode must be enabled so CSS shows the profile');
  assert.ok(hide>detailMode,'worklist must be hidden after detail mode is enabled');
  assert.ok(profile>hide,'visible profile container must be created after hiding worklist');
  assert.ok(open>profile,'selected profile must load into the visible container');
  assert.match(src,/development-back-to-list/);
  assert.match(src,/coachView\.classList\.remove\('coach-player-detail-open'\)/);
});

test('development player card has explicit interactive styling',()=>{
  assert.match(css,/\.development-player-card\s*\{/);
  assert.match(css,/cursor:pointer/);
  assert.match(css,/width:100%/);
});
