const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDevelopmentHistory, getDevelopmentHistoryMountTarget } = require('../profile-development-history.js');

test('combines goals, focuses and challenges newest first', () => {
  const result = buildDevelopmentHistory(
    [{ title: 'Bli bättre skytt', final_reflection: 'Jag tog fler avslut.', completed_at: '2026-08-30T10:00:00Z' }],
    [{ development_area: 'technique', focus_text: 'Bättre första touch', player_reflection: 'Jag blev lugnare med bollen.', ended_at: '2026-09-01T10:00:00Z' }],
    [{ title: '1000 TOUCHES', completed_at: '2026-09-03T10:00:00Z' }]
  );

  assert.deepEqual(result.map(item => item.type), ['challenge', 'focus', 'goal']);
  assert.equal(result[0].title, '1000 TOUCHES');
  assert.equal(result[1].label, 'FOKUS · TEKNIK');
  assert.equal(result[2].reflection, 'Jag tog fler avslut.');
});

test('ignores history rows without a usable date', () => {
  const result = buildDevelopmentHistory(
    [{ title: 'Mål utan datum', completed_at: null }],
    [],
    [{ title: 'Utmaning', completed_at: '2026-09-03T10:00:00Z' }]
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].type, 'challenge');
});

test('development history belongs on the development page', () => {
  assert.equal(getDevelopmentHistoryMountTarget(), 'developmentPage');
});
