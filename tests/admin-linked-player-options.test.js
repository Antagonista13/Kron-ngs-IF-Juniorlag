const test = require('node:test');
const assert = require('node:assert/strict');
const { selectablePlayersForUser } = require('../admin-page.js');

test('current linked player stays selectable while other linked players stay hidden', () => {
  const players = [
    { id: 'emil-player', full_name: 'Emil Bergqvist', profile_id: 'emil-profile', is_active: true },
    { id: 'free-player', full_name: 'Ledig Spelare', profile_id: null, is_active: true },
    { id: 'other-player', full_name: 'Annan Spelare', profile_id: 'other-profile', is_active: true }
  ];
  const result = selectablePlayersForUser(players, 'emil-player');
  assert.deepEqual(result.map((p) => p.id), ['emil-player', 'free-player']);
});
