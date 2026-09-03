const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachPlayerPageViewModel, buildCoachPlayerNavigation } = require('../coach-player-page.js');

test('builds a clear coach player detail header', () => {
  assert.deepEqual(buildCoachPlayerPageViewModel('Testspelare'), {
    title: 'Testspelare',
    backLabel: '← Tillbaka till spelaröversikten',
    subtitle: 'Mål · Fokus · Bedömning · Jämförelse · Historik'
  });
});

test('uses a safe fallback when player name is missing', () => {
  assert.equal(buildCoachPlayerPageViewModel('').title, 'Spelare');
});

test('builds internal navigation for the coach player page', () => {
  assert.deepEqual(buildCoachPlayerNavigation(), [
    { label: 'Mål', target: 'coachPlayerContext' },
    { label: 'Fokus', target: 'coachPlayerContext' },
    { label: 'Bedömning', target: 'coachPlayerDevelopment' },
    { label: 'Jämförelse', target: 'coachComparisonCard' },
    { label: 'Historik', target: 'coachHistorySection' }
  ]);
});
