const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('access gate force-hides disallowed navigation items', () => {
  const source = fs.readFileSync(path.join(root, 'access-gate.js'), 'utf8');
  assert.match(source, /button\.style\.display\s*=\s*allowed\.has\(button\.dataset\.page\)\s*\?\s*['"]['"]\s*:\s*['"]none['"]/);
});

test('parent profile removes player-only development sections and shows parent information', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /id="parentProfileInfo"/);
  assert.match(index, /data-player-profile-section/);
  assert.match(index, /profile-role-view\.js\?v=1/);

  const profileRole = fs.readFileSync(path.join(root, 'profile-role-view.js'), 'utf8');
  assert.match(profileRole, /role\s*===\s*['"]parent['"]/);
  assert.match(profileRole, /data-player-profile-section/);
  assert.match(profileRole, /parentProfileInfo/);
});
