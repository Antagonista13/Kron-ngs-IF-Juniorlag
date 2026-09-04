const assert = require('assert');
const fs = require('fs');
const roster = require('../player-roster.js');
const { buildRosterCardModel, shouldUseCompactLeaderTeamView } = roster;

assert.deepStrictEqual(buildRosterCardModel({full_name:'Axel',shirt_number:17,is_active:true,mobile_phone:'0701',birth_date:'2011-07-15'}),{name:'Axel',number:'#17',mobile:'0701',birthDate:'15 juli 2011',actionLabel:'Ta bort från truppen',isActive:true});
assert.deepStrictEqual(buildRosterCardModel({full_name:'Roney',shirt_number:null,is_active:false,mobile_phone:null,birth_date:null}),{name:'Roney',number:'',mobile:'',birthDate:'',actionLabel:'Återaktivera',isActive:false});

assert.equal(shouldUseCompactLeaderTeamView('admin'), true, 'admin should get compact leader team view');
assert.equal(shouldUseCompactLeaderTeamView('coach'), true, 'coach should get compact leader team view');
assert.equal(shouldUseCompactLeaderTeamView('player'), false, 'player should keep normal team view');
assert.equal(shouldUseCompactLeaderTeamView('parent'), false, 'parent should keep normal team view');

const js = fs.readFileSync('player-roster.js', 'utf8');
const css = fs.readFileSync('player-roster.css', 'utf8');
assert.ok(js.includes("classList.add('leader-team-view')") || js.includes('classList.add("leader-team-view")'), 'leader/admin role should explicitly activate the compact team class');
assert.ok(css.includes('#teamPage.leader-team-view.active'), 'compact layout should be tied to the explicit leader-team-view class');
assert.ok(!css.includes('#teamPage:has(#playerRosterSection).active'), 'compact layout must not depend on :has()');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'leader tools should render two by two on mobile');
assert.ok(css.includes('.player-roster-avatar{width:48px;height:48px'), 'profile image should keep its current 48px size');
assert.ok(css.includes('.player-roster-card-actions button{min-height:30px'), 'roster edit buttons should be compact on mobile');
console.log('player roster ui tests passed');
