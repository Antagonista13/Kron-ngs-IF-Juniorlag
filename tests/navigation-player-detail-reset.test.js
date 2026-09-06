const test = require('node:test');
const assert = require('node:assert/strict');
const { resetNestedPageState } = require('../navigation-scroll.js');

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

test('other bottom navigation destinations do not reset development detail state', () => {
  assert.equal(resetNestedPageState('homePage', { getElementById: () => null }), false);
});
