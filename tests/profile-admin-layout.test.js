const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const source=fs.readFileSync('profile-role-view.js','utf8');
const css=fs.readFileSync('leader-profile.css','utf8');

test('leader profile mirrors admin visual structure without admin tools',()=>{
  assert.match(source,/leader-profile admin-layout/);
  assert.match(source,/admin-page-header/);
  assert.match(source,/admin-kicker/);
  assert.match(source,/admin-overview/);
  assert.doesNotMatch(source,/id="leaderAdminQuickLink"/);
  assert.doesNotMatch(source,/id="leaderAdminStatus"/);
});

test('profile reuses admin card rhythm while keeping profile content',()=>{
  assert.match(css,/\.leader-profile\.admin-layout/);
  assert.match(source,/id="leaderAboutCard"/);
  assert.match(source,/id="leaderPlayerCount"/);
  assert.match(source,/id="leaderNextActivity"/);
});
