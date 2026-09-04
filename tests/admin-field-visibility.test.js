const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'admin-page.css'), 'utf8');

test('role-specific admin fields stay hidden when hidden attribute is set', () => {
  assert.match(
    css,
    /\.admin-user-card\s+\[hidden\]\s*\{[^}]*display\s*:\s*none\s*!important/i,
    'admin-page.css must force role-specific [hidden] fields to display:none'
  );
});
