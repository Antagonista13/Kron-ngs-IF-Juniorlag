const assert=require('assert');
const fs=require('fs');
const path=require('path');
const roster=require('../player-roster.js');

const player=roster.normalizePlayer({id:'1',full_name:'Karl Andersson',nickname:'Kalle'});
assert.strictEqual(player.name,'Karl Andersson');
assert.strictEqual(player.nickname,'Kalle');
assert.strictEqual(player.displayName,'Kalle');
assert.strictEqual(roster.normalizePlayer({full_name:'Karl Andersson',nickname:'   '}).displayName,'Karl Andersson');

const validated=roster.validatePlayerInput({name:'Karl Andersson',nickname:'Kalle'});
assert.strictEqual(validated.ok,true);
assert.strictEqual(validated.value.full_name,'Karl Andersson');
assert.strictEqual(validated.value.nickname,'Kalle');

const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/202609100001_player_nickname.sql'),'utf8');
assert.match(migration,/add column if not exists nickname text/i);
assert.match(migration,/list_public_roster_players/i);
assert.match(migration,/list_coach_roster_players/i);

const sync=fs.readFileSync(path.join(__dirname,'../supabase/functions/sportadmin-roster-sync/index.ts'),'utf8');
assert.doesNotMatch(sync,/nickname\s*:/i);
console.log('player nickname tests passed');
