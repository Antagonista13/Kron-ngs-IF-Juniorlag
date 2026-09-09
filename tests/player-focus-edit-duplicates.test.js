const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('edit button is rechecked after async focus lookup to prevent duplicates', () => {
  const js = fs.readFileSync('player-focus-edit.js', 'utf8');
  assert.match(js, /const focus=await getPlayerActiveFocus\(\);[\s\S]*if\(summary\.querySelector\('\[data-player-focus-edit\]'\)\) return;/);
});
