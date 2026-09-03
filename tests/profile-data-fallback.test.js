const assert = require('assert');
const { mergeHomeProfileFields } = require('../home-player-header.js');
const { mergeProfileAvatarFields } = require('../profile-avatar.js');

assert.deepStrictEqual(
  mergeHomeProfileFields(
    { full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', role: 'player' },
    { player_number: 17 },
    null
  ),
  { full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', role: 'player', player_number: 17, avatar_url: '' }
);

assert.deepStrictEqual(
  mergeProfileAvatarFields({ full_name: 'Testspelare' }, null),
  { full_name: 'Testspelare', avatar_url: '' }
);

console.log('profile data fallback tests passed');
