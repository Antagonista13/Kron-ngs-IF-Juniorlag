const assert = require('assert');
const { buildHomePlayerHeader, buildNavIcon } = require('../home-player-header.js');

const player = buildHomePlayerHeader({ full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', player_number: 17, avatar_url: null });
assert.strictEqual(player.name, 'Testspelare');
assert.strictEqual(player.meta, '#17 · Kronängs IF Juniorlag');
assert.strictEqual(player.avatarUrl, '');

const withoutNumber = buildHomePlayerHeader({ full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', player_number: null });
assert.strictEqual(withoutNumber.meta, 'Kronängs IF Juniorlag');

assert.ok(buildNavIcon('home').includes('<svg'));
assert.ok(buildNavIcon('development').includes('<svg'));
assert.ok(!buildNavIcon('profile').includes('👤'));

console.log('home-player-header tests passed');
