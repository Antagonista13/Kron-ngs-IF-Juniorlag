const test = require('node:test');
const assert = require('node:assert/strict');
const { resetNestedPageState, scrollToPageLanding } = require('../navigation-scroll.js');

test('reselecting Utveckling resets an open player detail to the development landing view', () => {
  const classNames = new Set(['coach-player-detail-open']);
  const coachView = { classList: { remove: (name) => classNames.delete(name) } };
  const detail = { hidden: false, innerHTML: '<p>Spelare</p>' };
  const worklist = { hidden: true };
  const doc = {
    getElementById(id) {
      return {
        coachDevelopmentView: coachView,
        coachPlayerDevelopment: detail,
        developmentWorklist: worklist
      }[id] || null;
    }
  };

  assert.equal(resetNestedPageState('developmentPage', doc), true);
  assert.equal(classNames.has('coach-player-detail-open'), false);
  assert.equal(detail.hidden, true);
  assert.equal(detail.innerHTML, '');
  assert.equal(worklist.hidden, false);
});

test('Utveckling tab scrolls to the development page landing, not the player card', () => {
  let scrolled = null;
  const developmentPage = { scrollIntoView: (options) => { scrolled = options; } };
  const doc = { getElementById: (id) => id === 'developmentPage' ? developmentPage : null };
  const win = { scrollTo: () => { throw new Error('should not scroll generic viewport top'); } };

  assert.equal(scrollToPageLanding('developmentPage', doc, win), true);
  assert.deepEqual(scrolled, { behavior: 'auto', block: 'start' });
});

test('other bottom navigation destinations do not reset development detail state', () => {
  assert.equal(resetNestedPageState('homePage', { getElementById: () => null }), false);
});
