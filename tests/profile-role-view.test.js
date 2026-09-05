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

test('leader next activity is clickable and profile script cache is bumped',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','profile-role-view.js'),'utf8');
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(source,/id="leaderNextActivityTile"[^>]*data-profile-page="calendarPage"/);
  assert.match(html,/profile-role-view\.js\?v=2/);
});
