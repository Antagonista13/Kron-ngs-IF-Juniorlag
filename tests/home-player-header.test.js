const fs = require('fs');
const assert = require('assert');
const { buildHomePlayerHeader, buildNavIcon, getHomeShortcutPage, isHomeActivationKey, getHomeVisibleCards, navIconSelectorForPage } = require('../home-player-header.js');

const player = buildHomePlayerHeader({ full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', role: 'player', player_number: 17, avatar_url: null });
assert.strictEqual(player.name, 'Testspelare');
assert.strictEqual(player.meta, 'Kronängs IF Juniorlag');
assert.strictEqual(player.playerNumber, '#17');
assert.strictEqual(player.roleLabel, '');
assert.strictEqual(player.avatarUrl, '');

const coach = buildHomePlayerHeader({ full_name: 'Henric', team: 'Kronängs IF Juniorlag', role: 'coach', player_number: null });
assert.strictEqual(coach.playerNumber, '');
assert.strictEqual(coach.roleLabel, 'Ledare');

const admin = buildHomePlayerHeader({ full_name: 'Admin', team: 'Kronängs IF Juniorlag', role: 'admin', player_number: null });
assert.strictEqual(admin.roleLabel, 'Ledare');

const withoutNumber = buildHomePlayerHeader({ full_name: 'Testspelare', team: 'Kronängs IF Juniorlag', role: 'player', player_number: null });
assert.strictEqual(withoutNumber.meta, 'Kronängs IF Juniorlag');
assert.strictEqual(withoutNumber.playerNumber, '');
assert.strictEqual(withoutNumber.roleLabel, '');

assert.deepStrictEqual(getHomeVisibleCards('parent'), { activity:true, news:true, focus:false, challenge:false });
assert.deepStrictEqual(getHomeVisibleCards('player'), { activity:true, news:true, focus:true, challenge:true });
assert.deepStrictEqual(getHomeVisibleCards('pending'), { activity:false, news:false, focus:false, challenge:false });

assert.ok(buildNavIcon('home').includes('<svg'));
assert.ok(buildNavIcon('development').includes('<svg'));
assert.ok(buildNavIcon('team').includes('<svg'));
assert.ok(!buildNavIcon('profile').includes('👤'));
assert.strictEqual(navIconSelectorForPage('developmentPage'), '.nav-icon-wrap > span');
assert.strictEqual(navIconSelectorForPage('homePage'), 'span');
assert.strictEqual(getHomeShortcutPage('activity'), 'calendarPage');
assert.strictEqual(getHomeShortcutPage('challenge'), 'developmentPage');
assert.strictEqual(getHomeShortcutPage('news'), 'teamPage');
assert.strictEqual(getHomeShortcutPage('profile'), 'profilePage');
assert.strictEqual(getHomeShortcutPage('unknown'), '');
assert.strictEqual(isHomeActivationKey('Enter'), true);
assert.strictEqual(isHomeActivationKey(' '), true);
assert.strictEqual(isHomeActivationKey('Escape'), false);

const css = fs.readFileSync('player-labels.css', 'utf8');
const numberStyle = css.match(/\.home-player-number\{([^}]*)\}/);
assert.ok(numberStyle, 'home-player-number override should exist');
assert.ok(numberStyle[1].includes('color:#d1aa67'), 'player number should use the gold label color');
assert.ok(numberStyle[1].includes('Segoe Script'), 'player number should use the handwritten label font');
assert.ok(numberStyle[1].includes('background:transparent'), 'player number should not use the old pill badge');

console.log('home-player-header tests passed');
