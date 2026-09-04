const test = require('node:test');
const assert = require('node:assert/strict');
const developmentRole = require('../development-role.js');
const { canEditSelfAssessment, shouldShowPlayerDevelopmentCards, getDevelopmentHeading } = developmentRole;

test('only player role can edit and save self assessment', () => {
  assert.equal(canEditSelfAssessment('player'), true);
  assert.equal(canEditSelfAssessment('coach'), false);
  assert.equal(canEditSelfAssessment('admin'), false);
  assert.equal(canEditSelfAssessment('parent'), false);
  assert.equal(canEditSelfAssessment('pending'), false);
  assert.equal(canEditSelfAssessment(null), false);
});

test('player development cards are visible only for players', () => {
  assert.equal(shouldShowPlayerDevelopmentCards('player'), true);
  assert.equal(shouldShowPlayerDevelopmentCards('coach'), false);
  assert.equal(shouldShowPlayerDevelopmentCards('admin'), false);
  assert.equal(shouldShowPlayerDevelopmentCards('parent'), false);
  assert.equal(shouldShowPlayerDevelopmentCards('pending'), false);
  assert.equal(shouldShowPlayerDevelopmentCards(null), false);
});

test('development heading is adapted to player and leader roles', () => {
  const leaderHeading = {
    title: 'Juniorlagets utveckling',
    subtitle: 'Följ spelarnas mål, fokus och utveckling över tid.'
  };
  assert.deepEqual(getDevelopmentHeading('coach', 'Testtränare'), leaderHeading);
  assert.deepEqual(getDevelopmentHeading('admin', 'Admin'), leaderHeading);
  assert.deepEqual(getDevelopmentHeading('player', 'Testspelare'), {
    title: 'Din utveckling, Testspelare',
    subtitle: 'Träna smart. Utvecklas varje dag.'
  });
});

test('leaders use dashboard mode while players use personal development mode', () => {
  assert.equal(typeof developmentRole.getDevelopmentViewMode, 'function');
  assert.equal(developmentRole.getDevelopmentViewMode('admin'), 'leader-dashboard');
  assert.equal(developmentRole.getDevelopmentViewMode('coach'), 'leader-dashboard');
  assert.equal(developmentRole.getDevelopmentViewMode('player'), 'player-development');
  assert.equal(developmentRole.getDevelopmentViewMode('parent'), 'hidden');
});
