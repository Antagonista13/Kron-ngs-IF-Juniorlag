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

test('admin can edit a player from inside the opened public player card', () => {
  assert.equal(typeof roster.canEditPlayerFromPublicCard,'function');
  assert.equal(roster.canEditPlayerFromPublicCard('admin'),true);
  assert.equal(roster.canEditPlayerFromPublicCard('coach'),false);
  assert.equal(roster.canEditPlayerFromPublicCard('player'),false);
  assert.equal(roster.canEditPlayerFromPublicCard('parent'),false);
  const js=fs.readFileSync(path.join(__dirname,'..','player-roster.js'),'utf8');
  assert.match(js,/player-public-profile-edit/);
  assert.match(js,/onEdit/);
});

test('public player card hides every sibling while open', () => {
  const css=fs.readFileSync(path.join(__dirname,'..','player-roster.css'),'utf8');
  assert.match(css, /player-roster-section>\[hidden\]\{display:none!important\}/);
});
