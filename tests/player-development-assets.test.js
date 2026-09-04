const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const index=fs.readFileSync('index.html','utf8');
const goal=fs.readFileSync('goal-summary.js','utf8');
const focus=fs.readFileSync('focus-summary.js','utf8');
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

test('development summary cards use shared line icon hooks',()=>{
  assert.match(goal,/development-card-icon/);
  assert.match(goal,/data-development-icon="goal"/);
  assert.match(goal,/data-development-icon="goal-history"/);
  assert.match(focus,/development-card-icon/);
  assert.match(focus,/data-development-icon="focus"/);
  assert.match(focus,/data-development-icon="focus-history"/);
  assert.match(workflowCss,/\.development-card-icon/);
  assert.match(workflowCss,/stroke:currentColor/);
});
