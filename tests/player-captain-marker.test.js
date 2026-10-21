const assert=require('assert');
const roster=require('../player-roster.js');
assert.strictEqual(roster.formatRosterTeamRoleMarker('captain'),' (K)');
assert.strictEqual(roster.formatRosterTeamRoleMarker('vice_captain'),' (VK)');
assert.strictEqual(roster.formatRosterTeamRoleMarker(''),'');
assert.strictEqual(roster.buildRosterDisplayName({full_name:'Emil Bergqvist',team_role:'captain'}),'Emil Bergqvist (K)');
assert.strictEqual(roster.buildRosterDisplayName({full_name:'Test',team_role:''}),'Test');
console.log('player captain marker tests passed');
