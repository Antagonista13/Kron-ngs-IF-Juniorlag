const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('coach assessment does not render the selected player name as a repeated heading', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'coach.js'), 'utf8');
  assert.equal(source.includes('<h3>${player.full_name}</h3>'), false);
});
