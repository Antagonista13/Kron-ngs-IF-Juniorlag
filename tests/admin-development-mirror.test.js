const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.existsSync('admin-development-mirror.js')?fs.readFileSync('admin-development-mirror.js','utf8'):'';
const html=fs.readFileSync('index.html','utf8');

test('admin development explicitly reuses the coach worklist without changing coach',()=>{
  assert.match(source,/role\s*!==\s*['"]admin['"]/);
  assert.match(source,/KronangCoachDevelopmentWorklist\.setup/);
  assert.doesNotMatch(source,/role\s*===\s*['"]coach['"]/);
  assert.match(source,/coachDevelopmentOverview/);
  assert.match(source,/coachTeamOverview/);
  assert.match(source,/coachRosterSearch/);
});

test('admin mirror loads after the canonical coach worklist',()=>{
  const worklist=html.indexOf('coach-development-worklist.js?v=9');
  const mirror=html.indexOf('admin-development-mirror.js?v=1');
  assert.ok(worklist>=0);
  assert.ok(mirror>worklist);
});
