const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('header foreground is isolated above decoration and crest is larger', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'team-staff.css'), 'utf8');
  assert.match(source, /\.hero-content\{[^}]*position:relative[^}]*z-index:2/s);
  assert.match(source, /\.logo\{[^}]*width:82px[^}]*height:82px/s);
});
