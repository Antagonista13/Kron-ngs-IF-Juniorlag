const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {profileRolePresentation,leaderSnapshotPresentation}=require('../profile-role-view.js');

test('player keeps development profile',()=>{
  const view=profileRolePresentation('player');
  assert.equal(view.showPlayerDevelopment,true);
  assert.equal(view.showLeaderProfile,false);
});

test('coach gets leader profile without player development cards',()=>{
  const view=profileRolePresentation('coach');
  assert.equal(view.showPlayerDevelopment,false);
  assert.equal(view.showLeaderProfile,true);
  assert.equal(view.roleLabel,'Ledare');
  assert.equal(view.showAdminStatus,false);
});

test('admin gets leader profile with administration status',()=>{
  const view=profileRolePresentation('admin');
  assert.equal(view.showPlayerDevelopment,false);
  assert.equal(view.showLeaderProfile,true);
  assert.equal(view.roleLabel,'Admin');
  assert.equal(view.showAdminStatus,true);
});

test('leader snapshot shows real player count and next activity text',()=>{
  assert.deepEqual(leaderSnapshotPresentation(44,'Träning tisdag 18:30'),{playerCount:'44',nextActivity:'Träning tisdag 18:30'});
  assert.deepEqual(leaderSnapshotPresentation(null,''),{playerCount:'–',nextActivity:'–'});
});

test('leader profile counts active roster players and uses fresh assets',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','profile-role-view.js'),'utf8');
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(source,/\.eq\(['"]is_active['"],\s*true\)/);
  assert.match(source,/leader-profile\.css\?v=2/);
  assert.match(html,/profile-role-view\.js\?v=5/);
  assert.match(html,/calendar-runtime\.js\?v=3/);
});

test('leader next activity is clickable and loads calendar directly',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','profile-role-view.js'),'utf8');
  assert.match(source,/id="leaderNextActivityTile"[^>]*data-profile-page="calendarPage"/);
  assert.match(source,/pageId===['"]calendarPage['"][^\n]*testSportAdminCalendar/);
});

test('leader profile refreshes when calendar finishes and when profile opens',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','profile-role-view.js'),'utf8');
  const calendar=fs.readFileSync(path.join(__dirname,'..','calendar-runtime.js'),'utf8');
  assert.match(calendar,/kronang:next-activity-updated/);
  assert.match(source,/addEventListener\(['"]kronang:next-activity-updated['"]/);
  assert.match(source,/data-page=[^\n]*profilePage|profilePage[^\n]*refreshLeaderProfile/);
});

test('mobile leader profile layout keeps cards balanced',()=>{
  const css=fs.readFileSync(path.join(__dirname,'..','leader-profile.css'),'utf8');
  assert.match(css,/\.leader-profile-links\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(css,/\.leader-profile-snapshot\{[^}]*grid-template-columns:minmax\(0,\.78fr\) minmax\(0,2\.22fr\)/);
  assert.match(css,/#leaderNextActivity\{[^}]*font-size:14px/);
  assert.match(css,/\.leader-profile-snapshot>div\{[^}]*min-width:0/);
  assert.match(css,/\.hero\{[^}]*width:100vw/);
});
