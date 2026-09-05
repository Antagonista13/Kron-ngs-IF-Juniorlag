const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { clearLoginPassword } = require('../auth-login-fields.js');

test('clears password without changing saved email', () => {
  const email = { value: 'coach@kronangsjunior.se' };
  const password = { value: 'hemligt' };
  clearLoginPassword(password);
  assert.equal(password.value, '');
  assert.equal(email.value, 'coach@kronangsjunior.se');
});

test('login offers a complete Supabase password recovery flow', () => {
  const auth = fs.readFileSync(path.join(__dirname, '..', 'auth.js'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(auth, /GLÖMT LÖSENORD\?/i);
  assert.match(auth, /resetPasswordForEmail\(/);
  assert.match(auth, /PASSWORD_RECOVERY/);
  assert.match(auth, /updateUser\(\{\s*password:/);
  assert.match(auth, /Bekräfta nytt lösenord/i);
  assert.match(index, /auth\.js\?v=7/);
});
