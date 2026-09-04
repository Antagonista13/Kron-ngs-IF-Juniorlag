const assert = require('assert');
const fs = require('fs');
const { buildRosterCardModel } = require('../player-roster.js');
assert.deepStrictEqual(buildRosterCardModel({full_name:'Axel',shirt_number:17,is_active:true,mobile_phone:'0701',birth_date:'2011-07-15'}),{name:'Axel',number:'#17',mobile:'0701',birthDate:'15 juli 2011',actionLabel:'Ta bort från truppen',isActive:true});
assert.deepStrictEqual(buildRosterCardModel({full_name:'Roney',shirt_number:null,is_active:false,mobile_phone:null,birth_date:null}),{name:'Roney',number:'',mobile:'',birthDate:'',actionLabel:'Återaktivera',isActive:false});

const css = fs.readFileSync('player-roster.css', 'utf8');
assert.ok(css.includes('#teamPage:has(#playerRosterSection).active'), 'leader/admin team page should use a compact dedicated layout');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'leader tools should render two by two on mobile');
assert.ok(css.includes('#teamWeeklyFocus'), 'weekly focus should participate in the compact leader grid');
assert.ok(css.includes('#teamPostComposer'), 'new post should participate in the compact leader grid');
assert.ok(css.includes('#teamFocusManager'), 'focus editor should participate in the compact leader grid');
assert.ok(css.includes('#teamChallengeManager'), 'challenge editor should participate in the compact leader grid');
assert.ok(css.includes('.player-roster-card-actions button{min-height:30px'), 'roster edit buttons should be compact on mobile');
assert.ok(css.includes('grid-template-columns:42px minmax(0,1fr)'), 'mobile roster rows should be compact instead of full administration cards');
console.log('player roster ui tests passed');
