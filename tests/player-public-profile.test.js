const assert=require('assert');
const fs=require('fs');
const roster=require('../player-roster.js');

const player=roster.normalizePlayer({id:'23',full_name:'Emil Bergqvist',shirt_number:23,position:'Målvakt',team_role:'captain',profile_id:'profile-23'});
assert.strictEqual(player.position,'Målvakt');
assert.strictEqual(player.teamRole,'captain');
assert.strictEqual(roster.formatTeamRole('captain'),'KAPTEN');
assert.strictEqual(roster.formatTeamRole('vice_captain'),'VICEKAPTEN');
assert.strictEqual(roster.formatTeamRole(''),'');
assert.strictEqual(roster.getPlayerCardDestination('player',player),'public');
assert.strictEqual(roster.getPlayerCardDestination('parent',player),'public');
assert.strictEqual(roster.getPlayerCardDestination('coach',player),'development');
assert.strictEqual(roster.getPlayerCardDestination('admin',player),'development');

const source=fs.readFileSync(require.resolve('../player-roster.js'),'utf8');
assert.match(source,/name="position"/);
assert.match(source,/name="team_role"/);
assert.match(source,/position,team_role/);
assert.match(source,/player-public-profile/);
console.log('player public profile tests passed');
