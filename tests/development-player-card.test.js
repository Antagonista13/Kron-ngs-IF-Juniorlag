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

test('click gives immediate opening feedback before profile fetch completes',()=>{
  const feedback=src.indexOf("detail.innerHTML='<p class=\"development-opening\">Hämtar utvecklingsprofil...");
  const scroll=src.indexOf('detail.scrollIntoView');
  const open=src.indexOf('await root.KronangDevelopmentProfile.openPlayerDevelopmentWorkflow');
  assert.ok(feedback>=0);
  assert.ok(scroll>feedback);
  assert.ok(open>scroll);
});

test('development player card has explicit interactive styling',()=>{
  assert.match(css,/\.development-player-card\s*\{/);
  assert.match(css,/cursor:pointer/);
  assert.match(css,/width:100%/);
});
