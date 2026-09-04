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

test('juniorlag 2.0 privileged actions follow the locked role hierarchy', () => {
  assert.equal(p.canManageStaff('admin'), true);
  assert.equal(p.canManageStaff('coach'), false);
  assert.equal(p.canManageProfileImages('admin'), true);
  assert.equal(p.canManageProfileImages('player'), false);

  assert.equal(p.canCreateTeamPost('admin'), true);
  assert.equal(p.canCreateTeamPost('coach'), true);
  assert.equal(p.canCreateTeamPost('player'), false);
  assert.equal(p.canCreateTeamPost('parent'), false);

  assert.equal(p.canManageTeamPost('admin', 'admin'), true);
  assert.equal(p.canManageTeamPost('admin', 'coach'), true);
  assert.equal(p.canManageTeamPost('coach', 'coach'), true);
  assert.equal(p.canManageTeamPost('coach', 'admin'), false);
  assert.equal(p.canManageTeamPost('player', 'coach'), false);

  assert.equal(p.canHideCalendarEvent('admin'), true);
  assert.equal(p.canHideCalendarEvent('coach'), true);
  assert.equal(p.canHideCalendarEvent('player'), false);
  assert.equal(p.canRestoreCalendarEvent('admin'), true);
  assert.equal(p.canRestoreCalendarEvent('coach'), false);
});
