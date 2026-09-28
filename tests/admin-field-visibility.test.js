const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'admin-page.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
test('role-specific admin fields stay hidden when hidden attribute is set', () => {
  assert.match(css,/\.admin-user-card\s+\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/i,'admin-page.css must force role-specific [hidden] fields to display:none');
});
test('admin page stylesheet uses a fresh cache version', () => {
  assert.notEqual(html.indexOf('admin-page.css?v=10'),-1,'index.html must load the current admin stylesheet with a fresh cache version');
});

test('admin users use a stable editor outside the dynamically reorganized card list', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'admin-page.js'), 'utf8');
  assert.match(html,/id="adminUserEditDialog"/);
  assert.match(html,/id="adminUserEditRole"/);
  assert.match(html,/id="adminUserEditTitle"/);
  assert.match(html,/id="adminUserEditDescription"/);
  assert.match(js,/data-action="open-editor"/);
  assert.match(js,/adminUserEditDialog/);
});

test('saving a leader refreshes the team staff view and reuses a matching staff name', () => {
  const adminJs = fs.readFileSync(path.join(__dirname, '..', 'admin-page.js'), 'utf8');
  const staffJs = fs.readFileSync(path.join(__dirname, '..', 'team-staff.js'), 'utf8');
  assert.match(adminJs,/staffForUser/);
  assert.match(adminJs,/kronang:team-staff-updated/);
  assert.match(staffJs,/kronang:team-staff-updated/);
});
