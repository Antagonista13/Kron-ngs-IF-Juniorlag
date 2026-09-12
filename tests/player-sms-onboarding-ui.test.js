const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const read = (path) => fs.readFileSync(path, 'utf8');

test('pre-auth onboarding screen owns ?onboard links before normal login', () => {
  assert.ok(fs.existsSync('player-onboarding.js'), 'player onboarding UI module must exist');
  const ui = read('player-onboarding.js');
  const loader = read('auth-login-fields.js');
  const html = read('index.html');
  assert.match(ui, /URLSearchParams/);
  assert.match(ui, /onboard/);
  assert.match(ui, /action\s*:\s*['"]validate['"]/);
  assert.match(ui, /Aktivera ditt konto|AKTIVERA KONTO/i);
  assert.match(ui, /E-post/i);
  assert.match(ui, /Bekräfta lösenord/i);
  assert.match(ui, /complete-player-onboarding/);
  assert.match(ui, /signInWithPassword/);
  assert.match(ui, /data-player-onboarding-active|playerOnboardingActive/i);
  assert.match(loader, /player-onboarding\.js\?v=1/);
  assert.match(loader, /document\.write/);
  assert.ok(html.indexOf('auth-login-fields.js') >= 0 && html.indexOf('auth-login-fields.js') < html.indexOf('auth.js'), 'onboarding loader must execute before normal auth');
});

test('Laget player profile exposes SMS invite only through the admin onboarding helper', () => {
  assert.ok(fs.existsSync('player-onboarding-invite.js'), 'admin player onboarding invite helper must exist');
  const invite = read('player-onboarding-invite.js');
  const loader = read('auth-login-fields.js');
  assert.match(invite, /role\s*!==\s*['"]admin['"]/);
  assert.match(invite, /create-player-onboarding/);
  assert.match(invite, /BJUD IN VIA SMS/);
  assert.match(invite, /Konto anslutet/);
  assert.match(invite, /sms:/);
  assert.match(invite, /playerId/);
  assert.match(invite, /MISSING_PHONE/);
  assert.match(invite, /player-onboarding-action/);
  assert.match(loader, /player-onboarding-invite\.js\?v=1/);
});

test('legacy parent and coach email invitation endpoint remains present', () => {
  const inviteUser = read('supabase/functions/invite-user/index.ts');
  assert.match(inviteUser, /parent/);
  assert.match(inviteUser, /coach/);
  assert.match(inviteUser, /inviteUserByEmail/);
});
