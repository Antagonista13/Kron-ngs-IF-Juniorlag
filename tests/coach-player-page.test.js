const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachPlayerPageViewModel, buildCoachPlayerNavigation } = require('../coach-player-page.js');

test('builds a clear coach player detail header', () => {
  assert.deepEqual(buildCoachPlayerPageViewModel('Testspelare'), {
    title: 'Testspelare',
    backLabel: '← Tillbaka till spelaröversikten',
    subtitle: 'Utveckling just nu · Återkoppling · Bedömning · Historik'
  });
});

test('uses a safe fallback when player name is missing', () => {
  assert.equal(buildCoachPlayerPageViewModel('').title, 'Spelare');
});

test('builds internal navigation for the coach player page', () => {
  assert.deepEqual(buildCoachPlayerNavigation(), [
    { label: 'Utveckling just nu', target: 'coachPlayerContext' },
    { label: 'Återkoppling', target: 'coachFocusFeedbackControls' },
    { label: 'Bedömning', target: 'coachPlayerDevelopment' },
    { label: 'Historik', target: 'coachHistorySection' }
  ]);
});
