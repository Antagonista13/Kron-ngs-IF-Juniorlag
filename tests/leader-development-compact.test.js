const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('coach-development-worklist.js','utf8');
const css=fs.readFileSync('leader-development-dashboard.css','utf8');

test('leader development removes the legacy coach overview instead of stacking two dashboards',()=>{
  assert.match(source,/const legacyOverview=document\.getElementById\('coachDevelopmentOverview'\)/);
  assert.match(source,/legacyOverview\.remove\(\)/);
});

test('leader development uses one compact summary strip',()=>{
  assert.match(source,/leader-development-summary-strip/);
  assert.doesNotMatch(source,/leader-development-dashboard/);
  assert.doesNotMatch(source,/leader-development-stat-wide/);
});

test('leader development keeps one search and a compact four-filter worklist',()=>{
  assert.match(source,/developmentWorklistSearch/);
  assert.match(source,/Behöver följas upp/);
  assert.match(source,/Saknar mål/);
  assert.match(source,/Nyligen uppdaterade/);
});

test('summary metrics are clickable filters',()=>{
  assert.match(source,/data-summary-filter="all"/);
  assert.match(source,/data-summary-filter="needs-follow-up"/);
  assert.match(source,/data-summary-filter="has-goal"/);
  assert.match(source,/data-summary-filter="has-focus"/);
  assert.match(source,/leader-development-summary-strip[^\n]*addEventListener\('click'/);
});

test('main development heading is visually stronger than player subheading',()=>{
  assert.match(css,/#developmentPage\s*>\s*\.page-heading\s+h2\{[^}]*font-size:\s*32px/);
  assert.match(css,/\.leader-development-workspace>h2\{[^}]*font-size:\s*22px/);
});
