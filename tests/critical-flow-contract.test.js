const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const home=fs.readFileSync('home-player-header.js','utf8');
const leader=fs.readFileSync('leader-tools-profile.js','utf8');
const admin=fs.readFileSync('admin-page.js','utf8');
const adminDevelopment=fs.readFileSync('admin-development-mirror.js','utf8');
const adminPlayerCardEdit=fs.existsSync('admin-player-card-edit.js')?fs.readFileSync('admin-player-card-edit.js','utf8'):'';
const playerRoster=fs.readFileSync('player-roster.js','utf8');
const sportadminBadge=fs.readFileSync('admin-sportadmin-badge.js','utf8');
const sportadminSync=fs.readFileSync('supabase/functions/sportadmin-roster-sync/index.ts','utf8');

test('critical Safari assets are versioned and loaded exactly once',()=>{
  for(const asset of ['navigation-scroll.js?v=3','home-player-header.js?v=10','leader-tools-profile.js?v=7','calendar-runtime.js?v=8','calendar-bridge.js?v=1','player-main-goal.js?v=1','coach-main-goal-review.js?v=1','coach-development-worklist.js?v=9','player-roster.js?v=11']){
    assert.equal(html.split(asset).length-1,1,asset+' must load exactly once');
  }
  assert.ok(html.indexOf('calendar-runtime.js?v=8')<html.indexOf('calendar-bridge.js?v=1'),'calendar bridge must load after runtime');
  assert.ok(html.indexOf('player-main-goal.js?v=1')<html.indexOf('development-profile.js?v=5'),'player main goal must own the player goal surface before legacy development profile');
  assert.ok(html.indexOf('coach-main-goal-review.js?v=1')<html.indexOf('coach-development-worklist.js?v=9'),'coach main goal review must load before the worklist');
});

test('Home next activity always routes to Calendar',()=>{
  assert.match(home,/activity:'calendarPage'/);
  assert.match(home,/activateHomeShortcut\(document\.getElementById\('homeNextActivityCard'\),'activity'\)/);
});

test('Profile leader tools keep roster management available',()=>{
  assert.match(leader,/id:'openProfileRosterManager',label:'HANTERA TRUPP'/);
  assert.match(leader,/ensureRosterButton\(panel,d\)/);
  assert.match(leader,/function openRosterManager\(/);
});

test('leader tools remain hosted on Profile rather than Laget',()=>{
  assert.match(leader,/function leaderToolsHostPageId\(\)\{return'profilePage';\}/);
});

test('admin has a separate SportAdmin notification badge',()=>{
  assert.equal(html.split('admin-sportadmin-badge.js?v=1').length-1,1,'SportAdmin badge script must load exactly once');
  assert.match(admin,/id="sportadminPendingBadge"/);
  assert.match(sportadminBadge,/getElementById\('sportadminPendingBadge'\)/);
  assert.doesNotMatch(sportadminBadge,/getElementById\('adminPendingBadge'\)/);
});

test('SportAdmin sync automatically adds new roster players without creating app accounts',()=>{
  assert.match(sportadminSync,/from\('players'\)\.insert\(\{full_name:canonicalPlayerName\(item\.full_name\),is_active:true\}\)/);
  assert.match(sportadminSync,/status:'approved'/);
  assert.match(sportadminSync,/created_player_id:/);
  assert.doesNotMatch(sportadminSync,/auth\.admin\.createUser|invite-user|profiles.*insert/i);
});

test('admin development owns a fallback host before starting the shared leader worklist',()=>{
  assert.match(adminDevelopment,/function\s+ensureAdminDevelopmentHost\s*\(/);
  assert.match(adminDevelopment,/coachPlayerList/);
  const ensureCall=adminDevelopment.indexOf('ensureAdminDevelopmentHost();');
  const setupCall=adminDevelopment.indexOf('KronangCoachDevelopmentWorklist.setup');
  assert.ok(ensureCall>=0&&setupCall>ensureCall,'admin must create the worklist host first');
});

test('admin player edit stays inside the open profile and saves directly by player id',()=>{
  assert.match(adminPlayerCardEdit,/player-public-profile-edit/);
  assert.match(adminPlayerCardEdit,/function\s+openInlineEditor\s*\(/);
  assert.match(adminPlayerCardEdit,/selectedRosterCard\.dataset\.playerId/);
  assert.match(adminPlayerCardEdit,/from\('players'\)\.select\(/);
  assert.match(adminPlayerCardEdit,/\.eq\('id',playerId\)\.maybeSingle\(\)/);
  assert.match(adminPlayerCardEdit,/from\('players'\)\.update\(/);
  assert.match(adminPlayerCardEdit,/\.eq\('id',playerId\)/);
  assert.match(adminPlayerCardEdit,/player-public-profile-edit-form/);
  assert.doesNotMatch(adminPlayerCardEdit,/openEditorById\(/);
  assert.doesNotMatch(adminPlayerCardEdit,/back\.click\(\)/);
  assert.match(adminDevelopment,/admin-player-card-edit\.js\?v=9/);
});

test('admin player profile shows mobile and edit mode clears bottom navigation',()=>{
  assert.match(adminPlayerCardEdit,/player-public-profile-mobile-admin/);
  assert.match(adminPlayerCardEdit,/mobile_phone/);
  assert.match(adminPlayerCardEdit,/is-admin-editing/);
  assert.match(adminPlayerCardEdit,/safe-area-inset-bottom/);
  assert.match(adminPlayerCardEdit,/padding-bottom/);
});

test('saving admin player details refreshes visible position and team role',()=>{
  assert.match(adminPlayerCardEdit,/syncVisiblePlayerDetails/);
  assert.match(adminPlayerCardEdit,/player-public-profile-position/);
  assert.match(adminPlayerCardEdit,/player-public-profile-role/);
  assert.match(adminPlayerCardEdit,/player-roster-card-meta/);
  assert.match(adminPlayerCardEdit,/team_role/);
  assert.match(adminPlayerCardEdit,/position/);
});
