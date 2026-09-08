const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const source=fs.readFileSync('team-page-content.js','utf8');
const staff=fs.readFileSync('team-staff.js','utf8');

test('team page loads the tabbed content controller',()=>{
  assert.match(html,/team-page-content\.js\?v=4/);
});

test('team page puts Team Manager information before the member tabs',()=>{
  assert.match(source,/teamInformationSlot/);
  assert.match(source,/teamMemberTabs/);
  assert.match(source,/teamPostsList/);
  assert.match(source,/insertBefore\(information,memberTabs\)/);
});

test('team page offers separate Spelare and Ledarstab tabs',()=>{
  assert.match(source,/data-team-view="players"/);
  assert.match(source,/data-team-view="staff"/);
  assert.match(source,/>Spelare</);
  assert.match(source,/>Ledarstab</);
  assert.match(source,/showTeamView/);
});

test('member tabs stay visible while the team page scrolls',()=>{
  assert.match(source,/#teamPage #teamMemberTabs\{[^}]*position:sticky/);
  assert.match(source,/top:8px/);
  assert.match(source,/z-index:30/);
});

test('only the selected roster section is visible',()=>{
  assert.match(source,/playerRosterSection/);
  assert.match(source,/teamStaffSection/);
  assert.match(source,/players\.hidden/);
  assert.match(source,/staff\.hidden/);
});

test('opening Ledarstab refreshes staff data',()=>{
  assert.match(source,/kronang:team-staff-refresh/);
  assert.match(staff,/kronang:team-staff-refresh/);
  assert.match(html,/team-staff\.js\?v=4/);
});
