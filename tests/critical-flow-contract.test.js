const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const home=fs.readFileSync('home-player-header.js','utf8');
const leader=fs.readFileSync('leader-tools-profile.js','utf8');

test('critical Safari assets are versioned and loaded exactly once',()=>{
  for(const asset of ['navigation-scroll.js?v=3','home-player-header.js?v=10','leader-tools-profile.js?v=6','calendar-runtime.js?v=8','calendar-bridge.js?v=1','player-main-goal.js?v=1','coach-main-goal-review.js?v=1','coach-development-worklist.js?v=7']){
    assert.equal(html.split(asset).length-1,1,asset+' must load exactly once');
  }
  assert.ok(html.indexOf('calendar-runtime.js?v=8')<html.indexOf('calendar-bridge.js?v=1'),'calendar bridge must load after runtime');
  assert.ok(html.indexOf('player-main-goal.js?v=1')<html.indexOf('development-profile.js?v=5'),'player main goal must own the player goal surface before legacy development profile');
  assert.ok(html.indexOf('coach-main-goal-review.js?v=1')<html.indexOf('coach-development-worklist.js?v=7'),'coach main goal review must load before the worklist');
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
