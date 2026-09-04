const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync('index.html','utf8');
const role=fs.readFileSync('development-role.js','utf8');
const workflowCss=fs.readFileSync('development-workflow.css','utf8');
const worklist=fs.readFileSync('coach-development-worklist.js','utf8');
const profile=fs.readFileSync('development-profile.js','utf8');

test('development workflow assets load in dependency order',()=>{
  const model=index.indexOf('development-workflow.js?v=1');
  const profileScript=index.indexOf('development-profile.js?v=1');
  const notifications=index.indexOf('development-notifications.js?v=1');
  const worklistScript=index.indexOf('coach-development-worklist.js?v=1');
  assert.ok(model>=0&&profileScript>model&&notifications>profileScript&&worklistScript>notifications);
  assert.match(index,/development-workflow\.css\?v=2/);
});

test('development navigation includes unread dot hook',()=>{
  assert.match(index,/development-unread-dot/);
  assert.match(index,/nav-icon-wrap/);
});

test('coach worklist exposes a clear unread marker per player',()=>{
  assert.match(worklist,/decoratePlayerCards/);
  assert.match(workflowCss,/\.development-player-new/);
  assert.match(workflowCss,/\.has-development-unread/);
});

test('exact unread development items receive a visible highlight',()=>{
  assert.match(workflowCss,/\.development-unread-item/);
  assert.match(workflowCss,/\.development-new/);
  assert.match(profile,/data-entity-type="development_goal"/);
  assert.match(profile,/data-entity-type="development_focus"/);
});

test('development summary cards use shared monochrome line icons',()=>{
  assert.match(role,/developmentGoalSummary:'goal'/);
  assert.match(role,/developmentFocusSummary:'focus'/);
  assert.match(role,/developmentGoalHistory:'goal-history'/);
  assert.match(role,/developmentFocusHistory:'focus-history'/);
  assert.match(role,/development-card-icon/);
  assert.match(workflowCss,/\.development-card-icon/);
  assert.match(workflowCss,/stroke:currentColor/);
});

test('wide development layout starts goal and focus on the same top row',()=>{
  assert.match(workflowCss,/#developmentGoalSummary\{grid-column:1;grid-row:2\}/);
  assert.match(workflowCss,/#developmentFocusSummary\{grid-column:2;grid-row:2\}/);
  assert.match(workflowCss,/#developmentGoalHistory\{grid-column:1;grid-row:3\}/);
  assert.match(workflowCss,/#developmentFocusHistory\{grid-column:2;grid-row:3\}/);
});
