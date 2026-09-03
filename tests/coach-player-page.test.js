const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachPlayerPageViewModel } = require('../coach-player-page.js');

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
