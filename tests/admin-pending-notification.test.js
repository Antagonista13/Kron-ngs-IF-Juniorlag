const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('SportAdmin badge counts unseen imports and hides itself after acknowledgement', async () => {
  let count = 3;
  const requests = [], badge = { setAttribute() {} }, alert = {};
  const query = {
    select(...args) { requests.push(['select', ...args]); return this; },
    eq(...args) { requests.push(['eq', ...args]); return this; },
    async is(...args) { requests.push(['is', ...args]); return { count, error: null }; }
  };
  const window = { kronangSupabase: { from(table) { requests.push(['from', table]); return query; } } };
  const context = vm.createContext({ window, document: {
    getElementById: id => id === 'sportadminPendingBadge' ? badge : alert,
    readyState: 'loading', addEventListener() {}
  } });
  vm.runInContext(fs.readFileSync('admin-sportadmin-badge.js', 'utf8'), context);
  await window.KronangSportAdminBadge.refresh();
  assert.deepEqual(JSON.parse(JSON.stringify(requests)), [
    ['from', 'sportadmin_player_candidates'], ['select', 'id', { count: 'exact', head: true }],
    ['eq', 'status', 'approved'], ['is', 'reviewed_at', null]
  ]);
  assert.equal(badge.textContent, '3');
  assert.equal(alert.hidden, false);
  count = 0;
  await window.KronangSportAdminBadge.refresh();
  assert.equal(badge.textContent, '0');
  assert.equal(alert.hidden, true);
});

test('a non-admin signed-in user has the administration entry removed', async () => {
  let removed = false;
  const entry = { remove() { removed = true; } };
  const query = { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { role: 'coach', is_active: true }, error: null }; } };
  const window = { kronangSupabase: {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'coach1' } } }, error: null }) },
    from() { return query; }
  } };
  const context = vm.createContext({ window, document: {
    getElementById: id => id === 'adminPage' || id === 'profilePage' ? {} : id === 'adminProfileEntry' ? entry : null,
    addEventListener() {}
  } });
  vm.runInContext(fs.readFileSync('admin-page.js', 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(removed, true);
});
