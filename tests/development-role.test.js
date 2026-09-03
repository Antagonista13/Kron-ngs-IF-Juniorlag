const test = require('node:test');
const assert = require('node:assert/strict');
const { canEditSelfAssessment, shouldShowPlayerDevelopmentCards } = require('../development-role.js');

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
