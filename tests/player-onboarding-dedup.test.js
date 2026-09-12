const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

test('player onboarding status uses a synchronous in-progress guard before async lookup', () => {
  const source = fs.readFileSync('player-onboarding-invite.js', 'utf8');
  const guard = source.indexOf('playerOnboardingDecorating');
  const lookup = source.indexOf("await root.kronangSupabase.from('players')");
  assert.ok(guard >= 0, 'decorate must mark the profile while async decoration is in progress');
  assert.ok(lookup >= 0, 'decorate must still load the selected player');
  assert.ok(guard < lookup, 'the in-progress guard must be set before the async player lookup starts');
  assert.match(source, /delete profile\.dataset\.playerOnboardingDecorating|profile\.dataset\.playerOnboardingDecorating\s*=\s*['"]['"]/,
    'decorate must release the in-progress guard after finishing or aborting');
});
