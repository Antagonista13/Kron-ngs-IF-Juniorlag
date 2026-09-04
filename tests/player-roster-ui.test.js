const assert = require('assert');
const { buildRosterCardModel, filterRosterPlayers, shouldShowRosterToggleInCard } = require('../player-roster.js');
assert.deepStrictEqual(buildRosterCardModel({full_name:'Axel',shirt_number:17,is_active:true,mobile_phone:'0701',birth_date:'2011-07-15'}),{name:'Axel',number:'#17',mobile:'0701',birthDate:'15 juli 2011',actionLabel:'Ta bort från truppen',isActive:true});
assert.deepStrictEqual(buildRosterCardModel({full_name:'Roney',shirt_number:null,is_active:false,mobile_phone:null,birth_date:null}),{name:'Roney',number:'',mobile:'',birthDate:'',actionLabel:'Återaktivera',isActive:false});

assert.deepStrictEqual(filterRosterPlayers([
  {id:'1',full_name:'Abdulazzim Hakmi',shirt_number:8},
  {id:'2',full_name:'Ubeyd Abdi',shirt_number:10}
], 'ubeyd').map(player => player.id), ['2']);
assert.deepStrictEqual(filterRosterPlayers([
  {id:'1',full_name:'Abdulazzim Hakmi',shirt_number:8},
  {id:'2',full_name:'Ubeyd Abdi',shirt_number:10}
], '8').map(player => player.id), ['1']);
assert.strictEqual(shouldShowRosterToggleInCard(true), false);
assert.strictEqual(shouldShowRosterToggleInCard(false), true);
console.log('player roster ui tests passed');
