const test = require('node:test');
const assert = require('node:assert/strict');
const { canEditSelfAssessment } = require('../development-role.js');

test('only player role can edit and save self assessment', () => {
  assert.equal(canEditSelfAssessment('player'), true);
  assert.equal(canEditSelfAssessment('coach'), false);
  assert.equal(canEditSelfAssessment('admin'), false);
  assert.equal(canEditSelfAssessment(null), false);
});
