const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

test('player Development has an explicit ordered journey contract',()=>{
  assert.match(html,/player-development-layout\.js\?v=5/);
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  for(const id of ['playerMainGoalSlot','playerFocusSlot','playerAssessmentSlot','playerTrendSlot','playerHistorySlot']) assert.match(layout,new RegExp(id));
  assert.match(layout,/\[goalSlot,focusSlot,assessmentSlot,trendSlot,historySlot\]/);
});

test('self assessment is presented as one named section',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/playerAssessmentHeading/);
  assert.match(layout,/SJÄLVSKATTNING/);
});

test('history is one card with three choices',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/playerUnifiedHistory/);
  assert.match(layout,/HISTORIK/);
  assert.match(layout,/Målhistorik/);
  assert.match(layout,/Fokushistorik/);
  assert.match(layout,/Utvecklingshistorik/);
  assert.match(layout,/data-history-panel/);
});

test('selected history choice survives later layout mutations',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/let activeHistoryKind=['"]goal['"]/);
  assert.match(layout,/activeHistoryKind=kind/);
  assert.match(layout,/showHistory\(activeHistoryKind\)/);
  assert.doesNotMatch(layout,/el\.hidden=index!==0/);
});

test('selected history tab reveals its existing history list directly',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/function revealHistoryContent\(target\)/);
  assert.match(layout,/startsWith\(['"]VISA ['"]\)/);
  assert.match(layout,/toggle\.click\(\)/);
  assert.match(layout,/revealHistoryContent\(target\)/);
});

test('goal history can override legacy owner hiding when selected',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/#playerHistoryContent #developmentGoalHistory:not\(\[hidden\]\)\{display:block!important\}/);
});

test('player development gets dedicated compact mobile styling',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/playerDevelopmentCompactStyles/);
  assert.match(layout,/player-development-journey/);
  assert.match(layout,/player-history-tabs/);
  assert.match(layout,/development-grid/);
  assert.match(layout,/#playerMainGoalCard/);
  assert.match(layout,/#developmentFocusSummary/);
});

test('development trend uses a compact two-column area grid on mobile',()=>{
  const layout=fs.readFileSync('player-development-layout.js','utf8');
  assert.match(layout,/#playerTrendSlot \.profile-trend-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(layout,/#playerTrendSlot \.profile-trend-row/);
  assert.match(layout,/#playerTrendSlot \.profile-trend-values/);
});
