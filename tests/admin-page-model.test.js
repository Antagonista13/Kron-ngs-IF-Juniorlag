const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdminUserModel, buildAdminOverview, formatAdminSavedAt, accountLinkLabel, accountLinkHelp, suggestPlayerForAccount } = require('../admin-page.js');

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

test('admin model keeps the last access save timestamp', () => {
  const model = buildAdminUserModel({ profile_id: 'u1', role: 'parent', access_updated_at: '2026-09-04T02:45:00Z' });
  assert.equal(model.accessUpdatedAt, '2026-09-04T02:45:00Z');
});

test('last saved timestamp is formatted in Swedish local time', () => {
  const label = formatAdminSavedAt('2026-09-04T02:45:00Z');
  assert.match(label, /^Senast sparad: /);
  assert.match(label, /4 sep/i);
  assert.match(label, /04:45/);
  assert.equal(formatAdminSavedAt(''), '');
});

test('player account linking uses clear language and exact name suggestion', () => {
  assert.equal(accountLinkLabel('player'), 'Koppla kontot till');
  assert.equal(accountLinkHelp('player'), 'Välj personen i spelartruppen som detta konto tillhör.');
  const players = [{ id: '1', full_name: 'Emil Bergqvist' }, { id: '2', full_name: 'Emil Andersson' }];
  assert.equal(suggestPlayerForAccount('Emil Bergqvist', players), '1');
  assert.equal(suggestPlayerForAccount('emil bergqvist', players), '1');
  assert.equal(suggestPlayerForAccount('Emil', players), '');
});
