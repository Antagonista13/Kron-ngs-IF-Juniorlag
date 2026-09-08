const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const source=fs.readFileSync('team-page-content.js','utf8');

test('team page loads the tabbed content controller',()=>{
  assert.match(html,/team-page-content\.js\?v=3/);
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

test('only the selected roster section is visible',()=>{
  assert.match(source,/playerRosterSection/);
  assert.match(source,/teamStaffSection/);
  assert.match(source,/players\.hidden/);
  assert.match(source,/staff\.hidden/);
});
