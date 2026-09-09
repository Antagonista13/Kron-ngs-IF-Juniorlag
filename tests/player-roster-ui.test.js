const assert = require('assert');
const fs = require('fs');
const roster = require('../player-roster.js');
const { buildRosterCardModel, shouldUseCompactLeaderTeamView } = roster;

assert.deepStrictEqual(buildRosterCardModel({full_name:'Axel',shirt_number:17,is_active:true,mobile_phone:'0701',birth_date:'2011-07-15'}),{name:'Axel',number:'#17',mobile:'0701',birthDate:'15 juli 2011',position:'',teamRole:'',actionLabel:'Ta bort från appen',isActive:true});
assert.deepStrictEqual(buildRosterCardModel({full_name:'Roney',shirt_number:null,is_active:false,mobile_phone:null,birth_date:null}),{name:'Roney',number:'',mobile:'',birthDate:'',position:'',teamRole:'',actionLabel:'Återaktivera',isActive:false});

assert.equal(shouldUseCompactLeaderTeamView('admin'), true, 'admin should get compact leader team view');
assert.equal(shouldUseCompactLeaderTeamView('coach'), true, 'coach should get compact leader team view');
assert.equal(shouldUseCompactLeaderTeamView('player'), false, 'player should keep normal team view');
assert.equal(shouldUseCompactLeaderTeamView('parent'), false, 'parent should keep normal team view');

const js = fs.readFileSync('player-roster.js', 'utf8');
const css = fs.readFileSync('player-roster.css', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');
assert.ok(js.includes("classList.toggle('leader-team-view'") || js.includes('classList.toggle("leader-team-view"'), 'leader/admin role should explicitly activate the compact team class');
assert.ok(js.includes('Borttagna/arkiverade spelare'), 'inactive roster section should be labelled as archived players');
assert.ok(js.includes('confirm('), 'removing an active player should require confirmation');
assert.ok(js.includes('Spelaren tas bara bort från appen'), 'confirmation should explain that SportAdmin is not affected');
assert.ok(css.includes('#teamPage.leader-team-view.active'), 'compact layout should be tied to the explicit leader-team-view class');
assert.ok(!css.includes('#teamPage:has(#playerRosterSection).active'), 'compact layout must not depend on :has() for layout activation');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'leader tools should render two by two on mobile');
assert.ok(css.includes('align-items:start'), 'paired mobile admin cards must keep independent heights instead of stretching to the tallest editor');
assert.ok(/player-roster-avatar\{width:48px;height:48px/.test(css), 'roster list thumbnail should keep its compact 48px size');
assert.ok(/player-roster-card-actions button\{min-height:30px/.test(css), 'roster edit buttons should be compact on mobile');
assert.ok(css.includes('.player-roster-avatar:not(:has(img))::after'), 'missing roster images should have a visible placeholder label');
assert.ok(css.includes('content:"BILD\\A KOMMER"'), 'missing roster images should say BILD KOMMER');
assert.ok(css.includes('#teamPostComposer:has(#teamPostForm:not([hidden]))>#openTeamPostComposer{display:none}'), 'open post button must disappear while the editor is open');
assert.ok(css.includes('#teamPage.leader-team-view.active>#teamFocusManager:has(#teamFocusForm:not([hidden])){grid-column:1/-1;min-height:0}'), 'open focus editor should use the full mobile width without stretching its neighbour');
assert.ok(css.includes('#teamFocusManager:has(#teamFocusForm:not([hidden]))>#openTeamFocusManager{display:none}'), 'focus opener must disappear while focus editor is open');
assert.ok(css.includes('#teamPage.leader-team-view.active>#teamChallengeManager:has(#teamChallengeForm:not([hidden])){grid-column:1/-1;min-height:0}'), 'open challenge editor should use the full mobile width without stretching its neighbour');
assert.ok(css.includes('#teamChallengeManager:has(#teamChallengeForm:not([hidden]))>#openTeamChallengeManager{display:none}'), 'challenge opener must disappear while challenge editor is open');
assert.ok(index.includes('player-roster.css?v=8'), 'roster css cache version must be current');
assert.ok(index.includes('player-roster.js?v=8'), 'roster js cache version must be current');
console.log('player roster ui tests passed');
