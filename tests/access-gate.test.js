const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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

test('access gate force-hides disallowed navigation items and pages', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'access-gate.js'), 'utf8');
  assert.match(source, /page\.style\.display\s*=\s*visible\s*\?\s*['"]['"]\s*:\s*['"]none['"]/);
  assert.match(source, /button\.style\.display\s*=\s*visible\s*\?\s*['"]['"]\s*:\s*['"]none['"]/);
});

test('parent profile removes player-only development sections and shows parent information', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /id="parentProfileInfo"/);
  assert.match(index, /data-player-profile-section/);
  assert.match(index, /profile-role-view\.js\?v=2/);

  const profileRole = fs.readFileSync(path.join(root, 'profile-role-view.js'), 'utf8');
  assert.match(profileRole, /role\s*===\s*['"]parent['"]/);
  assert.match(profileRole, /data-player-profile-section/);
  assert.match(profileRole, /parentProfileInfo/);
});
