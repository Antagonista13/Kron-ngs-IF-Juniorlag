const test=require('node:test');
const assert=require('node:assert/strict');
const {profileRolePresentation}=require('../profile-role-view.js');

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
