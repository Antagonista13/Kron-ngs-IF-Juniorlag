const test = require('node:test');
const assert = require('node:assert/strict');
const { goHomeAfterLogin, buildPostLoginUrl } = require('../auth-navigation.js');

test('builds a fresh same-page URL that forces a clean app load', () => {
  const url = buildPostLoginUrl({ pathname: '/Kron-ngs-IF-Juniorlag/', search: '?old=1' }, 12345);
  assert.equal(url, '/Kron-ngs-IF-Juniorlag/?login=12345');
});

test('navigates to a fresh home load instead of reloading stale page state', () => {
  const calls = [];
  const fakeWindow = {
    location: {
      pathname: '/Kron-ngs-IF-Juniorlag/',
      search: '',
      replace: url => calls.push(['replace', url])
    },
    history: { scrollRestoration: 'auto' }
  };

  goHomeAfterLogin(fakeWindow, 67890);

  assert.equal(fakeWindow.history.scrollRestoration, 'manual');
  assert.deepEqual(calls, [['replace', '/Kron-ngs-IF-Juniorlag/?login=67890']]);
});
