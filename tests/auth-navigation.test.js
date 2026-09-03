const test = require('node:test');
const assert = require('node:assert/strict');
const { goHomeAfterLogin } = require('../auth-navigation.js');

test('clears page state and reloads the app after login', () => {
  const calls = [];
  const fakeWindow = {
    location: { pathname: '/Kron-ngs-IF-Juniorlag/', search: '', reload: () => calls.push('reload') },
    history: { replaceState: (_state, _title, url) => calls.push(url) }
  };
  goHomeAfterLogin(fakeWindow);
  assert.deepEqual(calls, ['/Kron-ngs-IF-Juniorlag/', 'reload']);
});
