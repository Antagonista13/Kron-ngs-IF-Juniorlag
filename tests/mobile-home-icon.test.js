const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('iPhone home screen uses the Kronäng shield as touch icon', () => {
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(index, /<link\s+rel="apple-touch-icon"\s+href="20260605_154224349_iOS\.jpg\?v=2">/);
  assert.match(index, /<meta\s+name="apple-mobile-web-app-title"\s+content="Kronäng Junior">/);
});
