const test = require('node:test');
const assert = require('node:assert/strict');
const { canManageTeamPosts, validateTeamPost, formatTeamPostDate } = require('../team-posts.js');

test('only coach and admin roles can manage team posts', () => {
  assert.equal(canManageTeamPosts('coach'), true);
  assert.equal(canManageTeamPosts('admin'), true);
  assert.equal(canManageTeamPosts('player'), false);
  assert.equal(canManageTeamPosts(null), false);
});

test('requires both title and body for a team post', () => {
  assert.deepEqual(validateTeamPost('', 'Text'), { valid: false, message: 'Skriv en rubrik.' });
  assert.deepEqual(validateTeamPost('Rubrik', ''), { valid: false, message: 'Skriv ett meddelande.' });
  assert.deepEqual(validateTeamPost(' Rubrik ', ' Text '), { valid: true, title: 'Rubrik', body: 'Text' });
});

test('formats team post dates in Swedish', () => {
  assert.equal(formatTeamPostDate('2026-09-03T08:00:00Z'), '3 september 2026');
});
