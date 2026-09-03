const test = require('node:test');
const assert = require('node:assert/strict');
const { allowedPagesForRole, buildAccessState } = require('../access-gate.js');

const allPages = ['homePage','calendarPage','developmentPage','teamPage','profilePage'];

test('parent cannot access development', () => {
  assert.deepEqual(allowedPagesForRole('parent'), ['homePage','calendarPage','teamPage','profilePage']);
});

test('player coach and admin keep development access', () => {
  ['player','coach','admin'].forEach(role => assert.ok(allowedPagesForRole(role).includes('developmentPage')));
  assert.deepEqual(allowedPagesForRole('player'), allPages);
});

test('pending and unknown roles receive no app pages', () => {
  assert.deepEqual(allowedPagesForRole('pending'), []);
  assert.deepEqual(allowedPagesForRole('unknown'), []);
  assert.equal(buildAccessState({role:'pending',is_active:true}).status, 'pending');
  assert.equal(buildAccessState({role:'unknown',is_active:true}).status, 'pending');
});

test('disabled profile is blocked regardless of active role', () => {
  const state = buildAccessState({role:'coach',is_active:false});
  assert.equal(state.status, 'disabled');
  assert.deepEqual(state.allowedPages, []);
});
