const test = require('node:test');
const assert = require('node:assert/strict');
const { validateTeamChallenge, buildTeamChallengeViewModel, canManageTeamChallenge, shouldRefreshChallengeForAuthEvent } = require('../team-challenge.js');

test('coach and admin can manage weekly challenge', () => {
  assert.equal(canManageTeamChallenge('coach'), true);
  assert.equal(canManageTeamChallenge('admin'), true);
  assert.equal(canManageTeamChallenge('player'), false);
});

test('weekly challenge requires title and instruction', () => {
  assert.deepEqual(validateTeamChallenge('', 'Text'), { valid: false, message: 'Skriv en rubrik.' });
  assert.deepEqual(validateTeamChallenge('1000 touches', ''), { valid: false, message: 'Skriv en instruktion.' });
  assert.deepEqual(validateTeamChallenge(' 1000 touches ', ' Träna 10 minuter. '), { valid: true, title: '1000 TOUCHES', instruction: 'Träna 10 minuter.' });
});

test('challenge view model includes completed state', () => {
  assert.deepEqual(buildTeamChallengeViewModel({ id: 'c1', title: '1000 TOUCHES', instruction: 'Träna.', completed: true }), {
    id: 'c1', title: '1000 TOUCHES', instruction: 'Träna.', completed: true
  });
});

test('weekly challenge refreshes when the signed-in user changes', () => {
  assert.equal(shouldRefreshChallengeForAuthEvent('SIGNED_IN', { user: { id: 'coach' } }), true);
  assert.equal(shouldRefreshChallengeForAuthEvent('SIGNED_OUT', null), true);
  assert.equal(shouldRefreshChallengeForAuthEvent('TOKEN_REFRESHED', { user: { id: 'coach' } }), false);
});
