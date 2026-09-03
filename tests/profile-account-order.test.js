const test = require('node:test');
const assert = require('node:assert/strict');
const { getAccountCardPlacement } = require('../logout.js');

test('account card belongs at the end of profile', () => {
  assert.equal(getAccountCardPlacement(), 'last');
});
