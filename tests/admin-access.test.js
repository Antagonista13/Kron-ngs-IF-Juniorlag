const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { validateApproval, validateInvite } = require('../admin-access.js');

test('player approval requires a linked player', () => {
  const result = validateApproval({ role: 'player', playerId: '', displayTitle: '' });
  assert.equal(result.ok, false);
  assert.match(result.message, /spelare/i);
});

test('parent approval strips player link and coach title is optional', () => {
  const parent = validateApproval({ role: 'parent', playerId: 'p1', displayTitle: 'Ignored' });
  assert.equal(parent.ok, true);
  assert.equal(parent.value.playerId, null);
  assert.equal(parent.value.displayTitle, null);
  const coach = validateApproval({ role: 'coach', playerId: 'p1', displayTitle: '' });
  assert.equal(coach.ok, true);
  assert.equal(coach.value.playerId, null);
  assert.equal(coach.value.displayTitle, null);
});

test('admin and pending cannot be assigned through ordinary approval', () => {
  assert.equal(validateApproval({ role: 'admin' }).ok, false);
  assert.equal(validateApproval({ role: 'pending' }).ok, false);
});

test('invite validates email and expected role', () => {
  assert.equal(validateInvite({ email: 'bad', fullName: 'Test', expectedRole: '' }).ok, false);
  assert.equal(validateInvite({ email: 'test@example.com', fullName: 'Test', expectedRole: 'admin' }).ok, false);
  for (const role of ['', 'player', 'parent', 'coach']) {
    assert.equal(validateInvite({ email: 'test@example.com', fullName: 'Test', expectedRole: role }).ok, true);
  }
});

test('admin player edit opens the roster form before closing the public profile', () => {
  const source = fs.readFileSync('admin-player-card-edit.js','utf8');
  assert.match(source,/\.player-public-profile-back/);
  assert.match(source,/await\s+rosterApi\.openEditorById\(playerId\)[\s\S]{0,500}back\.click\(\)/);
  assert.doesNotMatch(source,/dispatchEvent\(/);
  assert.doesNotMatch(source,/new CustomEvent\(/);
  assert.doesNotMatch(source,/rosterEdit\.click\(\)/);
});
