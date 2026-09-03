const test = require('node:test');
const assert = require('node:assert/strict');
const { getHomeVisibleCards } = require('../home-player-header.js');
const { canManageTeamPosts, canViewTeamPosts } = require('../team-posts.js');
const { canManageTeamChallenge, canViewTeamChallenge } = require('../team-challenge.js');
const { canManageRoster } = require('../player-roster.js');
const { canUseCoachWorkspace } = require('../coach.js');
const { getAccountRoleLabel } = require('../logout.js');

test('home card visibility follows role matrix', () => {
  assert.deepEqual(getHomeVisibleCards('parent'), { activity:true, news:true, focus:false, challenge:false });
  assert.deepEqual(getHomeVisibleCards('player'), { activity:true, news:true, focus:true, challenge:true });
  assert.deepEqual(getHomeVisibleCards('pending'), { activity:false, news:false, focus:false, challenge:false });
});

test('parent reads news but cannot manage leader content or weekly challenge', () => {
  assert.equal(canViewTeamPosts('parent'), true);
  assert.equal(canViewTeamChallenge('parent'), false);
  for (const role of ['parent','pending']) {
    assert.equal(canManageTeamPosts(role), false);
    assert.equal(canManageTeamChallenge(role), false);
    assert.equal(canManageRoster(role), false);
  }
});

test('admin uses coach workspace and profile labels are accurate', () => {
  assert.equal(canUseCoachWorkspace('admin'), true);
  assert.equal(canUseCoachWorkspace('coach'), true);
  assert.equal(canUseCoachWorkspace('player'), false);
  assert.equal(getAccountRoleLabel('admin','Team Manager / Lagledare'), 'Team Manager / Lagledare');
  assert.equal(getAccountRoleLabel('admin',''), 'Admin');
  assert.equal(getAccountRoleLabel('coach','Head Coach'), 'Head Coach');
  assert.equal(getAccountRoleLabel('coach',''), 'Ledare');
  assert.equal(getAccountRoleLabel('player',''), 'Spelare');
  assert.equal(getAccountRoleLabel('parent',''), 'Förälder');
  assert.equal(getAccountRoleLabel('pending',''), 'Väntar på godkännande');
});
