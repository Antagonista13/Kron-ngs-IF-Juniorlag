const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync('index.html','utf8');
const role=fs.readFileSync('development-role.js','utf8');
const icons=fs.readFileSync('development-card-icons.js','utf8');
const workflowCss=fs.readFileSync('development-workflow.css','utf8');

test('development workflow assets load in dependency order',()=>{
  const model=index.indexOf('development-workflow.js?v=1');
  const profile=index.indexOf('development-profile.js?v=1');
  const notifications=index.indexOf('development-notifications.js?v=1');
  const worklist=index.indexOf('coach-development-worklist.js?v=1');
  assert.ok(model>=0&&profile>model&&notifications>profile&&worklist>notifications);
  assert.match(index,/development-workflow\.css\?v=2/);
});

test('development navigation includes unread dot hook',()=>{
  assert.match(index,/development-unread-dot/);
  assert.match(index,/nav-icon-wrap/);
});

test('development summary cards use shared monochrome line icons',()=>{
  assert.match(role,/development-card-icons\.js\?v=1/);
  assert.match(icons,/developmentGoalSummary:'goal'/);
  assert.match(icons,/developmentFocusSummary:'focus'/);
  assert.match(icons,/developmentGoalHistory:'goal-history'/);
  assert.match(icons,/developmentFocusHistory:'focus-history'/);
  assert.match(icons,/development-card-icon/);
  assert.match(workflowCss,/\.development-card-icon/);
  assert.match(workflowCss,/stroke:currentColor/);
});

test('wide development layout starts goal and focus on the same top row',()=>{
  assert.match(workflowCss,/#developmentGoalSummary\{grid-column:1;grid-row:2\}/);
  assert.match(workflowCss,/#developmentFocusSummary\{grid-column:2;grid-row:2\}/);
  assert.match(workflowCss,/#developmentGoalHistory\{grid-column:1;grid-row:3\}/);
  assert.match(workflowCss,/#developmentFocusHistory\{grid-column:2;grid-row:3\}/);
});
