const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const staff = require('../team-staff.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'team-staff.js'), 'utf8');

test('builds a public staff profile from existing team_staff data', () => {
  assert.equal(typeof staff.buildStaffProfileModel, 'function');
  const profile = staff.buildStaffProfileModel({
    id: 'staff-1', display_name: 'Anna Andersson', staff_role: 'Tränare',
    description: 'Ansvarar för spelarutveckling.', phone: '070 123 45 67',
    email: 'anna@example.se', avatar_url: '/anna.jpg'
  });
  assert.deepEqual(profile, {
    id: 'staff-1', name: 'Anna Andersson', role: 'Tränare',
    description: 'Ansvarar för spelarutveckling.', phone: '070 123 45 67',
    email: 'anna@example.se', avatarUrl: '/anna.jpg',
    phoneHref: 'tel:0701234567', emailHref: 'mailto:anna@example.se'
  });
});

test('staff cards are keyboard/click accessible while contact links keep native actions', () => {
  assert.match(source, /team-staff-card.*staff-profile-open/s);
  assert.match(source, /card\.addEventListener\('click'/);
  assert.match(source, /event\.target\.closest\('a,button,input,select,textarea,label'\)/);
  assert.match(source, /role','button'/);
  assert.match(source, /tabIndex=0/);
});

test('staff profile has back to team and optional contact links', () => {
  assert.match(source, /staff-profile-back/);
  assert.match(source, /← Laget/);
  assert.match(source, /team-staff-profile/);
  assert.match(source, /phoneHref/);
  assert.match(source, /emailHref/);
});
