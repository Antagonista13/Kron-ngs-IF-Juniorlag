const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('role permissions and admin access load together as classic browser scripts', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync('role-permissions.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('admin-access.js', 'utf8'), context);
  assert.equal(typeof context.window.KronangPermissions.canManageUsers, 'function');
  assert.equal(typeof context.window.KronangAdminAccess.validateInvite, 'function');
});

test('critical Safari assets are versioned and loaded exactly once', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  for (const asset of ['home-player-header.js?v=11','leader-tools-profile.js?v=7','calendar-runtime.js?v=17','calendar-bridge.js?v=5']) {
    assert.equal(html.split(asset).length - 1, 1, asset + ' must load exactly once');
  }
  assert.ok(html.indexOf('calendar-runtime.js?v=17') < html.indexOf('calendar-bridge.js?v=5'));
});

test('Home next activity keeps routing to Calendar', () => {
  const home = fs.readFileSync('home-player-header.js', 'utf8');
  assert.match(home, /activity:'calendarPage'/);
  assert.match(home, /activateHomeShortcut\(document\.getElementById\('homeNextActivityCard'\),'activity'\)/);
});

test('Profile keeps roster management in leader tools', () => {
  const leader = fs.readFileSync('leader-tools-profile.js', 'utf8');
  assert.match(leader, /id:'openProfileRosterManager',label:'HANTERA TRUPP'/);
  assert.match(leader, /ensureRosterButton\(panel,d\)/);
  assert.match(leader, /function leaderToolsHostPageId\(\)\{return'profilePage';\}/);
});

test('calendar helpers load after leader tools in the shared classic-script scope', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const order = [...html.matchAll(/<script[^>]+src="([^"?]+)(?:\?[^\"]*)?"/g)]
    .map(match => match[1])
    .filter(file => ['leader-tools-profile.js', 'calendar-management.js'].includes(file));
  assert.deepEqual(order, ['leader-tools-profile.js', 'calendar-management.js']);
  const context = vm.createContext({window: {}});
  for (const file of order) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, {filename: file});
  }
  assert.equal(typeof context.window.KronangCalendarManagement.stableExternalEventKey, 'function');
  assert.equal(context.window.KronangCalendarManagement.stableExternalEventKey({uid: 'sportadmin-123'}), 'uid:sportadmin-123');
});
