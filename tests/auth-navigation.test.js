const test = require('node:test');
const assert = require('node:assert/strict');
const { goHomeAfterLogin, restoreHomeAfterLogin, installHomeAfterLoginRestore } = require('../auth-navigation.js');

test('marks the next load to open home and reloads after login', () => {
  const calls = [];
  const stored = {};
  const fakeWindow = {
    location: { pathname: '/Kron-ngs-IF-Juniorlag/', search: '', reload: () => calls.push('reload') },
    history: { replaceState: (_state, _title, url) => calls.push(url) },
    sessionStorage: { setItem: (key, value) => { stored[key] = value; } }
  };
  goHomeAfterLogin(fakeWindow);
  assert.equal(stored.kronangOpenHomeAfterLogin, '1');
  assert.deepEqual(calls, ['/Kron-ngs-IF-Juniorlag/', 'reload']);
});

test('restores home page, home nav and top scroll on the reloaded page', () => {
  const removed = [];
  const scrolled = [];
  const pages = [{ id: 'homePage', classList: fakeClassList(false) }, { id: 'teamPage', classList: fakeClassList(true) }];
  const navs = [{ dataset: { page: 'homePage' }, classList: fakeClassList(false) }, { dataset: { page: 'teamPage' }, classList: fakeClassList(true) }];
  const fakeWindow = { sessionStorage: { getItem: () => '1', removeItem: key => removed.push(key) }, scrollTo: (x,y) => scrolled.push([x,y]), requestAnimationFrame: cb => cb() };
  const fakeDocument = { querySelectorAll: selector => selector === '.page' ? pages : navs };
  assert.equal(restoreHomeAfterLogin(fakeWindow, fakeDocument), true);
  assert.equal(pages[0].classList.contains('active'), true);
  assert.equal(pages[1].classList.contains('active'), false);
  assert.equal(navs[0].classList.contains('active'), true);
  assert.equal(navs[1].classList.contains('active'), false);
  assert.deepEqual(scrolled, [[0,0]]);
  assert.deepEqual(removed, ['kronangOpenHomeAfterLogin']);
});

test('waits until window load before consuming the home reset flag', () => {
  const events = {};
  let restoreCalls = 0;
  const fakeWindow = { addEventListener: (name, cb) => { events[name] = cb; } };
  const fakeDocument = { readyState: 'loading' };
  installHomeAfterLoginRestore(fakeWindow, fakeDocument, () => { restoreCalls += 1; });
  assert.equal(restoreCalls, 0);
  assert.equal(typeof events.load, 'function');
  events.load();
  assert.equal(restoreCalls, 1);
});

function fakeClassList(initialActive) {
  const values = new Set(initialActive ? ['active'] : []);
  return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value) };
}
