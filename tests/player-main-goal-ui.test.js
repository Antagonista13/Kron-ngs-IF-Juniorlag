const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const mod = require('../player-main-goal.js');

test('player main goal maps lifecycle to approved Swedish labels', () => {
  assert.equal(mod.buildMainGoalViewModel(null).statusLabel, 'UTKAST');
  assert.equal(mod.buildMainGoalViewModel({status:'draft',review_status:'returned'}).statusLabel, 'UTKAST');
  assert.equal(mod.buildMainGoalViewModel({status:'pending_review',review_status:'pending_review'}).statusLabel, 'VÄNTAR PÅ TRÄNARE');
  assert.equal(mod.buildMainGoalViewModel({status:'active',review_status:'approved'}).statusLabel, 'GODKÄNT ✓');
});

test('new player main goal module owns player goal surface before legacy modules load', () => {
  const html = fs.readFileSync('index.html','utf8');
  const mainGoal = html.indexOf('player-main-goal.js?v=1');
  const profile = html.indexOf('development-profile.js?v=5');
  const goalSummary = html.indexOf('goal-summary.js?v=8');
  assert.ok(mainGoal > -1);
  assert.ok(mainGoal < profile);
  assert.ok(mainGoal < goalSummary);
});

test('legacy player goal mounts respect the new owner flag', () => {
  const profile = fs.readFileSync('development-profile.js','utf8');
  const summary = fs.readFileSync('goal-summary.js','utf8');
  assert.match(profile, /KronangPlayerMainGoalOwnsPlayerView/);
  assert.match(summary, /KronangPlayerMainGoalOwnsPlayerView/);
});
