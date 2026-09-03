const test = require('node:test');
const assert = require('node:assert/strict');
const { canEditSelfAssessment, shouldShowPlayerDevelopmentCards, getDevelopmentHeading } = require('../development-role.js');

test('only player role can edit and save self assessment', () => {
  assert.equal(canEditSelfAssessment('player'), true);
  assert.equal(canEditSelfAssessment('coach'), false);
  assert.equal(canEditSelfAssessment('admin'), false);
  assert.equal(canEditSelfAssessment(null), false);
});

test('player development cards are hidden for coaches but remain visible for players', () => {
  assert.equal(shouldShowPlayerDevelopmentCards('player'), true);
  assert.equal(shouldShowPlayerDevelopmentCards('coach'), false);
  assert.equal(shouldShowPlayerDevelopmentCards('admin'), false);
  assert.equal(shouldShowPlayerDevelopmentCards(null), false);
});

test('development heading is adapted to player and coach roles', () => {
  assert.deepEqual(getDevelopmentHeading('coach', 'Testtränare'), {
    title: 'Juniorlagets utveckling',
    subtitle: 'Följ spelarnas mål, fokus och utveckling över tid.'
  });
  assert.deepEqual(getDevelopmentHeading('player', 'Testspelare'), {
    title: 'Din utveckling, Testspelare',
    subtitle: 'Träna smart. Utvecklas varje dag.'
  });
});
