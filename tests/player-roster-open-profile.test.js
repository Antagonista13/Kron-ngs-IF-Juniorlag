const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const roster = require('../player-roster.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'player-roster.js'), 'utf8');

test('linked roster player exposes profile navigation target', () => {
  assert.equal(roster.getRosterProfileTarget({ profile_id: 'profile-23' }), 'profile-23');
  assert.equal(roster.getRosterProfileTarget({ profile_id: null }), '');
});

test('roster card click opens the 2.0 development player card by roster id', () => {
  assert.match(source, /card\.addEventListener\('click'/);
  assert.match(source, /event\.target\.closest\('button,a,input,select,textarea,label'\)/);
  assert.match(source, /development-player-open/);
  assert.match(source, /data-player-id/);
  assert.match(source, /player\.id/);
  assert.match(source, /developmentPage/);
});
