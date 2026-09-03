const test = require('node:test');
const assert = require('node:assert/strict');
const { clearLoginPassword } = require('../auth-login-fields.js');

test('clears password without changing saved email', () => {
  const email = { value: 'coach@kronangsjunior.se' };
  const password = { value: 'hemligt' };
  clearLoginPassword(password);
  assert.equal(password.value, '');
  assert.equal(email.value, 'coach@kronangsjunior.se');
});
