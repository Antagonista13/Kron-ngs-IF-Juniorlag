const assert = require('assert');
const { buildHomePlayerHeader, buildNavIcon, getHomeShortcutPage, isHomeActivationKey } = require('../home-player-header.js');

const player = buildHomePlayerHeader({ full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', player_number: 17, avatar_url: null });
assert.strictEqual(player.name, 'Testspelare');
assert.strictEqual(player.meta, 'Kronängs IF Juniorlag');
assert.strictEqual(player.playerNumber, '#17');
assert.strictEqual(player.avatarUrl, '');

const withoutNumber = buildHomePlayerHeader({ full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', player_number: null });
assert.strictEqual(withoutNumber.meta, 'Kronängs IF Juniorlag');
assert.strictEqual(withoutNumber.playerNumber, '');

assert.ok(buildNavIcon('home').includes('<svg'));
assert.ok(buildNavIcon('development').includes('<svg'));
assert.ok(!buildNavIcon('profile').includes('👤'));
assert.strictEqual(getHomeShortcutPage('activity'), 'calendarPage');
assert.strictEqual(getHomeShortcutPage('challenge'), 'developmentPage');
assert.strictEqual(getHomeShortcutPage('profile'), 'profilePage');
assert.strictEqual(getHomeShortcutPage('unknown'), '');
assert.strictEqual(isHomeActivationKey('Enter'), true);
assert.strictEqual(isHomeActivationKey(' '), true);
assert.strictEqual(isHomeActivationKey('Escape'), false);

console.log('home-player-header tests passed');
