const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

test('player Development has an explicit ordered journey contract',()=>{
  assert.match(html,/player-development-layout\.js\?v=3/);
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  for(const id of ['playerMainGoalSlot','playerFocusSlot','playerAssessmentSlot','playerTrendSlot','playerHistorySlot']) assert.match(layout,new RegExp(id));
  assert.match(layout,/\[goalSlot,focusSlot,assessmentSlot,trendSlot,historySlot\]/);
});

test('self assessment is presented as one named compact section',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/playerAssessmentHeading/);
  assert.match(layout,/SJÄLVSKATTNING/);
  assert.match(layout,/player-development-compact/);
});

test('history tabs preserve selected panel instead of resetting it',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/playerUnifiedHistory/);
  assert.match(layout,/activeHistory/);
  assert.match(layout,/showHistory\(activeHistory\)/);
  assert.match(layout,/aria-selected/);
  assert.match(layout,/Målhistorik/);
  assert.match(layout,/Fokushistorik/);
  assert.match(layout,/Utvecklingshistorik/);
});

test('compact mobile presentation is loaded',()=>{
  assert.match(html,/player-development-compact\.css\?v=1/);
});
