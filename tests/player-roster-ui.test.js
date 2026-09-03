const assert = require('assert');
const { buildRosterCardModel } = require('../player-roster.js');
assert.deepStrictEqual(buildRosterCardModel({full_name:'Axel',shirt_number:17,is_active:true,mobile_phone:'0701',birth_date:'2011-07-15'}),{name:'Axel',number:'#17',mobile:'0701',birthDate:'15 juli 2011',actionLabel:'Ta bort från truppen',isActive:true});
assert.deepStrictEqual(buildRosterCardModel({full_name:'Roney',shirt_number:null,is_active:false,mobile_phone:null,birth_date:null}),{name:'Roney',number:'',mobile:'',birthDate:'',actionLabel:'Återaktivera',isActive:false});
console.log('player roster ui tests passed');
