const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('coach-development-worklist.js','utf8');

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
