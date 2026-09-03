const assert = require('assert');
const { choosePlayerNumber, buildHomePlayerHeader } = require('../home-player-header.js');
assert.strictEqual(choosePlayerNumber({shirt_number:17},{player_number:9}),17);
assert.strictEqual(choosePlayerNumber(null,{player_number:9}),9);
assert.strictEqual(choosePlayerNumber({shirt_number:null},{player_number:9}),9);
assert.strictEqual(choosePlayerNumber(null,{player_number:null}),'');
assert.strictEqual(buildHomePlayerHeader({full_name:'Ledare',role:'coach',player_number:17,team:'Kronängs IF Juniorlag'}).playerNumber,'');
console.log('player shirt number source tests passed');
