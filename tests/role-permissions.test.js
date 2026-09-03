const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('../role-permissions.js');

test('role matrix is default deny', () => {
  assert.equal(p.normalizeRole('unknown'), 'pending');
  assert.equal(p.isLeaderRole('admin'), true);
  assert.equal(p.isLeaderRole('coach'), true);
  assert.equal(p.isLeaderRole('player'), false);
  assert.equal(p.canViewNews('parent'), true);
  assert.equal(p.canViewCalendar('parent'), true);
  assert.equal(p.canViewWeeklyFocus('parent'), false);
  assert.equal(p.canViewWeeklyChallenge('parent'), false);
  assert.equal(p.canViewOwnDevelopment('parent'), false);
  assert.equal(p.canViewRoster('parent'), false);
  assert.equal(p.canManageUsers('admin'), true);
  assert.equal(p.canManageUsers('coach'), false);
  assert.equal(p.canViewNews('pending'), false);
  assert.equal(p.canViewNews(null), false);
});
