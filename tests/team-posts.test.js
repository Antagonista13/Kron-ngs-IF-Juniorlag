const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { canManageTeamPosts, canManageSpecificTeamPost, canViewTeamPosts, validateTeamPost, formatTeamPostDate, sortTeamPosts, buildTeamPostEditState, normalizeTeamPostImageUrl } = require('../team-posts.js');

test('only coach and admin roles can create team posts', () => {
  assert.equal(canManageTeamPosts('coach'), true);
  assert.equal(canManageTeamPosts('admin'), true);
  assert.equal(canManageTeamPosts('player'), false);
  assert.equal(canManageTeamPosts('parent'), false);
  assert.equal(canManageTeamPosts('pending'), false);
});

test('post ownership follows the locked admin coach hierarchy', () => {
  assert.equal(canManageSpecificTeamPost('admin','admin'), true);
  assert.equal(canManageSpecificTeamPost('admin','coach'), true);
  assert.equal(canManageSpecificTeamPost('coach','coach'), true);
  assert.equal(canManageSpecificTeamPost('coach','admin'), false);
  assert.equal(canManageSpecificTeamPost('player','coach'), false);
  assert.equal(canManageSpecificTeamPost('parent','coach'), false);
});

test('parent can read team posts while pending cannot', () => {
  assert.equal(canViewTeamPosts('parent'), true);
  assert.equal(canViewTeamPosts('player'), true);
  assert.equal(canViewTeamPosts('pending'), false);
});

test('requires both title and body for a team post', () => {
  assert.deepEqual(validateTeamPost('', 'Text'), { valid: false, message: 'Skriv en rubrik.' });
  assert.deepEqual(validateTeamPost('Rubrik', ''), { valid: false, message: 'Skriv ett meddelande.' });
  assert.deepEqual(validateTeamPost(' Rubrik ', ' Text '), { valid: true, title: 'Rubrik', body: 'Text' });
});

test('formats team post dates in Swedish', () => {
  assert.equal(formatTeamPostDate('2026-09-03T08:00:00Z'), '3 september 2026');
});

test('pinned posts sort before newer normal posts', () => {
  const posts = [
    { id: 'new', is_pinned: false, created_at: '2026-09-03T10:00:00Z' },
    { id: 'pin', is_pinned: true, created_at: '2026-09-01T10:00:00Z' },
    { id: 'old', is_pinned: false, created_at: '2026-09-01T09:00:00Z' }
  ];
  assert.deepEqual(sortTeamPosts(posts).map((post) => post.id), ['pin', 'new', 'old']);
});

test('normalizes optional image urls', () => {
  assert.equal(normalizeTeamPostImageUrl('  https://example.com/photo.jpg  '), 'https://example.com/photo.jpg');
  assert.equal(normalizeTeamPostImageUrl(null), '');
});

test('edit state preserves author role and optional image url', () => {
  assert.deepEqual(buildTeamPostEditState({ id: 'abc', title: ' Träning ', body: ' Kom i tid ', is_pinned: true, image_url: ' https://example.com/a.jpg ', author_role:'coach' }), {
    id: 'abc', title: 'Träning', body: 'Kom i tid', isPinned: true, imageUrl: 'https://example.com/a.jpg', authorRole:'coach'
  });
});

test('publish button is visually outlined as the primary action', () => {
  const css = fs.readFileSync('team-posts.css', 'utf8');
  const index = fs.readFileSync('index.html', 'utf8');
  assert.match(css, /\.team-post-submit\{[^}]*border:[^;}]*(#d0a85e|rgb\(208,\s*168,\s*94\))/i);
  assert.ok(index.includes('team-posts.css?v=10'), 'team post css cache version should be bumped');
});
