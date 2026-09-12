const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const read = (path) => fs.readFileSync(path, 'utf8');

test('pre-auth onboarding screen owns ?onboard links before normal login', () => {
  assert.ok(fs.existsSync('player-onboarding.js'), 'player onboarding UI module must exist');
  const ui = read('player-onboarding.js');
  const auth = read('auth.js');
  const html = read('index.html');
  assert.match(ui, /URLSearchParams/);
  assert.match(ui, /onboard/);
  assert.match(ui, /action\s*:\s*['"]validate['"]/);
  assert.match(ui, /Aktivera ditt konto|AKTIVERA KONTO/i);
  assert.match(ui, /E-post/i);
  assert.match(ui, /Bekräfta lösenord/i);
  assert.match(ui, /complete-player-onboarding/);
  assert.match(ui, /signInWithPassword/);
  assert.match(auth, /KronangPlayerOnboarding/);
  assert.match(auth, /isActive/);
  assert.ok(html.indexOf('player-onboarding.js') >= 0 && html.indexOf('player-onboarding.js') < html.indexOf('auth.js'), 'onboarding UI must load before normal auth');
});

test('Laget player profile exposes SMS invite only through the admin onboarding helper', () => {
  assert.ok(fs.existsSync('player-onboarding-invite.js'), 'admin player onboarding invite helper must exist');
  const invite = read('player-onboarding-invite.js');
  const html = read('index.html');
  const css = read('player-roster.css');
  assert.match(invite, /role\s*!==\s*['"]admin['"]/);
  assert.match(invite, /create-player-onboarding/);
  assert.match(invite, /BJUD IN VIA SMS/);
  assert.match(invite, /Konto anslutet/);
  assert.match(invite, /sms:/);
  assert.match(invite, /playerId/);
  assert.match(invite, /MISSING_PHONE/);
  assert.match(css, /player-onboarding-action/);
  assert.match(html, /player-onboarding-invite\.js/);
});

test('legacy parent and coach email invitation endpoint remains present', () => {
  const inviteUser = read('supabase/functions/invite-user/index.ts');
  assert.match(inviteUser, /parent/);
  assert.match(inviteUser, /coach/);
  assert.match(inviteUser, /inviteUserByEmail/);
});
