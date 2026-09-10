const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const roster = require('../player-roster.js');

test('linked roster player exposes profile navigation target', () => {
  assert.equal(roster.getRosterProfileTarget({ profile_id: 'profile-23' }), 'profile-23');
  assert.equal(roster.getRosterProfileTarget({ profile_id: null }), '');
});

test('Laget cards open the public player card for every signed-in team role', () => {
  assert.equal(roster.getPlayerCardDestination('admin',{id:'p1',profile_id:'u1'}),'public');
  assert.equal(roster.getPlayerCardDestination('coach',{id:'p1',profile_id:'u1'}),'public');
  assert.equal(roster.getPlayerCardDestination('player',{id:'p1'}),'public');
  assert.equal(roster.getPlayerCardDestination('parent',{id:'p1'}),'public');
});

test('public player card hides every sibling while open', () => {
  const css=fs.readFileSync(path.join(__dirname,'..','player-roster.css'),'utf8');
  assert.match(css, /player-roster-section>\[hidden\]\{display:none!important\}/);
});
