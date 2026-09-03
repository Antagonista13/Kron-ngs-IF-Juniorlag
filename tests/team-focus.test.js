const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTeamFocus, buildTeamFocusViewModel, normalizeTeamFocusWords } = require('../team-focus.js');

test('requires a title and focus words', () => {
  assert.deepEqual(validateTeamFocus('', 'PRESS HJÄLP'), { valid: false, message: 'Skriv veckans fokus.' });
  assert.deepEqual(validateTeamFocus('Bolltapp', ''), { valid: false, message: 'Skriv fokusorden.' });
});

test('formats title in uppercase and adds dots between focus words', () => {
  assert.deepEqual(validateTeamFocus(' Bolltapp → Direkt återerövring ', ' press hjälp krymp '), {
    valid: true,
    title: 'BOLLTAPP → DIREKT ÅTERERÖVRING',
    words: 'PRESS · HJÄLP · KRYMP'
  });
  assert.equal(normalizeTeamFocusWords('press · hjälp, krymp'), 'PRESS · HJÄLP · KRYMP');
});

test('builds the same focus content for home and team views', () => {
  assert.deepEqual(buildTeamFocusViewModel({ title: 'BOLLTAPP → DIREKT ÅTERERÖVRING', focus_words: 'PRESS · HJÄLP · KRYMP' }), {
    title: 'BOLLTAPP → DIREKT ÅTERERÖVRING',
    words: 'PRESS · HJÄLP · KRYMP'
  });
});
