const assert=require('assert');
const fs=require('fs');
const path=require('path');
const roster=require('../player-roster.js');

const player=roster.normalizePlayer({id:'1',full_name:'Karl Andersson',nickname:'Kalle'});
assert.strictEqual(player.name,'Karl Andersson');
assert.strictEqual(player.nickname,'Kalle');
assert.strictEqual(player.displayName,'Karl "Kalle" Andersson');
assert.strictEqual(roster.normalizePlayer({full_name:'Karl Andersson',nickname:'   '}).displayName,'Karl Andersson');

const validated=roster.validatePlayerInput({name:'Karl Andersson',nickname:'Kalle'});
assert.strictEqual(validated.ok,true);
assert.strictEqual(validated.value.full_name,'Karl Andersson');
assert.strictEqual(validated.value.nickname,'Kalle');

const card=roster.buildRosterCardModel({full_name:'Karl Andersson',nickname:'Kalle'},'player');
assert.strictEqual(card.name,'Karl "Kalle" Andersson');
assert.strictEqual(roster.buildRosterCardModel({full_name:'Karl Andersson',nickname:'   '},'player').name,'Karl Andersson');

const singleName=roster.normalizePlayer({full_name:'Pelé',nickname:'Pele'});
assert.strictEqual(singleName.displayName,'Pelé "Pele"');

const rosterJs=fs.readFileSync(path.join(__dirname,'../player-roster.js'),'utf8');
assert.match(rosterJs,/makeRosterField\('Smeknamn','text','nickname'\)/);
assert.match(rosterJs,/select\('id,full_name,nickname,/);
assert.match(rosterJs,/form\.elements\.nickname\.value/);
assert.match(rosterJs,/nickname:form\.elements\.nickname\.value/);
assert.match(rosterJs,/document\.createTextNode\(p\.displayName\)/);

const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/202609100001_player_nickname.sql'),'utf8');
assert.match(migration,/add column if not exists nickname text/i);
assert.match(migration,/list_public_roster_players/i);
assert.match(migration,/list_coach_roster_players/i);

const sync=fs.readFileSync(path.join(__dirname,'../supabase/functions/sportadmin-roster-sync/index.ts'),'utf8');
assert.doesNotMatch(sync,/nickname\s*:/i);
console.log('player nickname tests passed');
