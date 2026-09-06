const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
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

test('weekly focus card opens the focus editor for leaders only', () => {
  const source = fs.readFileSync('team-focus.js', 'utf8');
  assert.match(source, /card\.addEventListener\('click'/);
  assert.match(source, /canManageTeamFocus\(profile&&profile\.role\)/);
  assert.match(source, /setTeamFocusEditorOpen\(manager,form,true\)/);
  assert.match(source, /card\.setAttribute\('role','button'\)/);
  assert.match(source, /card\.tabIndex=0/);
});
