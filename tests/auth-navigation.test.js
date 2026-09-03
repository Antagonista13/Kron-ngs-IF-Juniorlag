const test = require('node:test');
const assert = require('node:assert/strict');
const { activateHome, handleAuthNavigation } = require('../auth-navigation.js');

function fakeClassList(initialActive) {
  const values = new Set(initialActive ? ['active'] : []);
  return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value) };
}

function makeUi() {
  const pages = [{ id: 'homePage', classList: fakeClassList(false) }, { id: 'profilePage', classList: fakeClassList(true) }];
  const navs = [{ dataset: { page: 'homePage' }, classList: fakeClassList(false) }, { dataset: { page: 'profilePage' }, classList: fakeClassList(true) }];
  const events = [];
  const doc = {
    querySelectorAll: selector => selector === '.page' ? pages : navs,
    dispatchEvent: event => events.push(event.type)
  };
  const win = { scrollTo: (x, y) => events.push(`scroll:${x}:${y}`), requestAnimationFrame: cb => cb() };
  return { pages, navs, events, doc, win };
}

test('activateHome switches from profile to home and scrolls to top', () => {
  const ui = makeUi();
  assert.equal(activateHome(ui.win, ui.doc), true);
  assert.equal(ui.pages[0].classList.contains('active'), true);
  assert.equal(ui.pages[1].classList.contains('active'), false);
  assert.equal(ui.navs[0].classList.contains('active'), true);
  assert.equal(ui.navs[1].classList.contains('active'), false);
  assert.ok(ui.events.includes('scroll:0:0'));
});

test('SIGNED_IN activates home and announces account refresh', () => {
  const ui = makeUi();
  handleAuthNavigation('SIGNED_IN', { user: { id: 'player' } }, ui.win, ui.doc);
  assert.equal(ui.pages[0].classList.contains('active'), true);
  assert.ok(ui.events.includes('kronang:auth-signed-in'));
});

test('SIGNED_OUT announces account reset', () => {
  const ui = makeUi();
  handleAuthNavigation('SIGNED_OUT', null, ui.win, ui.doc);
  assert.ok(ui.events.includes('kronang:auth-signed-out'));
});
