const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const worklist=fs.readFileSync('coach-development-worklist.js','utf8');
const workflow=fs.readFileSync('development-workflow.js','utf8');
const css=fs.readFileSync('leader-development-dashboard.css','utf8');

test('summary metrics are real buttons mapped to useful roster filters',()=>{
  assert.match(worklist,/leader-development-summary-item/);
  assert.match(worklist,/data-summary-filter="all"/);
  assert.match(worklist,/data-summary-filter="needs-follow-up"/);
  assert.match(worklist,/data-summary-filter="has-goal"/);
  assert.match(worklist,/data-summary-filter="has-focus"/);
  assert.match(worklist,/summary-filter/);
});

test('workflow can filter players that have goals or focus',()=>{
  assert.match(workflow,/activeFilter==='has-goal'/);
  assert.match(workflow,/activeFilter==='has-focus'/);
});

test('main development heading is visually larger than the Spelare subheading',()=>{
  assert.match(css,/#developmentPage>h2\{[^}]*font-size:30px/);
  assert.match(css,/\.leader-development-workspace>h2\{[^}]*font-size:22px/);
});
