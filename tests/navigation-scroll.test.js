const test = require('node:test');
const assert = require('node:assert/strict');
const { scrollPageTop, configureScrollRestoration } = require('../navigation-scroll.js');

test('scrollPageTop always scrolls viewport to top', () => {
  let call = null;
  const win = { scrollTo: (...args) => { call = args; } };
  scrollPageTop(win);
  assert.deepEqual(call, [0, 0]);
});

test('configureScrollRestoration disables browser position restore', () => {
  const win = { history: { scrollRestoration: 'auto' } };
  configureScrollRestoration(win);
  assert.equal(win.history.scrollRestoration, 'manual');
});
