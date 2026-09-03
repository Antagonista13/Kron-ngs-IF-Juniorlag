const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdminUserModel, buildAdminOverview } = require('../admin-page.js');

test('admin user is locked from ordinary role controls', () => {
  const model = buildAdminUserModel({ profile_id: 'a1', full_name: 'Admin', email: 'a@example.com', role: 'admin', is_active: true });
  assert.equal(model.locked, true);
  assert.equal(model.roleLabel, 'Admin');
});

test('overview counts pending, active users and leaders', () => {
  const rows = [
    { role: 'pending', is_active: true },
    { role: 'player', is_active: true },
    { role: 'parent', is_active: false },
    { role: 'coach', is_active: true },
    { role: 'admin', is_active: true }
  ];
  assert.deepEqual(buildAdminOverview(rows), { pending: 1, activeUsers: 3, leaders: 2 });
});
