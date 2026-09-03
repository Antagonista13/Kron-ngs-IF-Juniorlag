const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTeamFocus, buildTeamFocusViewModel } = require('../team-focus.js');

test('requires a title and focus words', () => {
  assert.deepEqual(validateTeamFocus('', 'PRESS · HJÄLP'), { valid: false, message: 'Skriv veckans fokus.' });
  assert.deepEqual(validateTeamFocus('Bolltapp', ''), { valid: false, message: 'Skriv fokusorden.' });
  assert.deepEqual(validateTeamFocus(' Bolltapp → Direkt återerövring ', ' PRESS · HJÄLP · KRYMP '), {
    valid: true,
    title: 'Bolltapp → Direkt återerövring',
    words: 'PRESS · HJÄLP · KRYMP'
  });
});

test('builds the same focus content for home and team views', () => {
  assert.deepEqual(buildTeamFocusViewModel({ title: 'Bolltapp → Direkt återerövring', focus_words: 'PRESS · HJÄLP · KRYMP' }), {
    title: 'Bolltapp → Direkt återerövring',
    words: 'PRESS · HJÄLP · KRYMP'
  });
});
