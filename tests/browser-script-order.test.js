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
