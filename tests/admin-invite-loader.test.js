const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('admin access module is cache-busted and loaded before admin page', () => {
  const access = html.indexOf('admin-access.js?v=3');
  const page = html.indexOf('admin-page.js?v=4');
  assert.notEqual(access, -1, 'admin-access.js must use the current fresh cache version');
  assert.notEqual(page, -1, 'admin-page.js must use the current fresh cache version');
  assert.ok(access < page, 'admin-access.js must load before admin-page.js');
});
