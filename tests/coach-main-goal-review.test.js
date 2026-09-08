const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const mod = require('../coach-main-goal-review.js');

test('coach review model keeps player ownership and exposes approve/return actions', () => {
  const model = mod.buildCoachMainGoalReviewModel({id:'g1',title:'Bättre första touch',description:'Träna mottagningar',status:'pending_review'});
  assert.equal(model.playerOwned, true);
  assert.equal(model.canApprove, true);
  assert.equal(model.canReturn, true);
  assert.equal(model.heading, 'HUVUDMÅL VÄNTAR PÅ DIG');
});

test('coach review module is loaded before development worklist', () => {
  const html = fs.readFileSync('index.html','utf8');
  const review = html.indexOf('coach-main-goal-review.js?v=1');
  const worklist = html.indexOf('coach-development-worklist.js?v=5');
  assert.ok(review > -1);
  assert.ok(worklist > -1);
  assert.ok(review < worklist);
});

test('coach worklist mounts the main goal review in selected player profile', () => {
  const source = fs.readFileSync('coach-development-worklist.js','utf8');
  assert.match(source, /KronangCoachMainGoalReview/);
  assert.match(source, /mount\(profileContainer,p,me\.role\)/);
});
