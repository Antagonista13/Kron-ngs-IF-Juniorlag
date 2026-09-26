const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const migrations=path.join(__dirname,'..','supabase','migrations');
const chatMigration=()=>fs.readdirSync(migrations).filter(n=>n.endsWith('_player_chat.sql')).map(n=>fs.readFileSync(path.join(migrations,n),'utf8')).join('\n');

test('player chat schema is RLS protected and authenticated-only',()=>{
 const sql=chatMigration();
 for(const table of ['player_chat_conversations','player_chat_messages','player_chat_reads']){
  assert.match(sql,new RegExp('alter table public\\.'+table+' enable row level security','i'));
 }
 assert.match(sql,/revoke all on (?:table )?public\.player_chat_(?:conversations|messages|reads) from anon/i);
 assert.match(sql,/grant select[^;]* on public\.player_chat_conversations to authenticated/i);
});

test('chat access is scoped to own player or active same-team leaders',()=>{
 const sql=chatMigration();
 assert.match(sql,/current_profile_active\(\)/i);
 assert.match(sql,/current_profile_role\(\).*player/i);
 assert.match(sql,/profile_id\s*=\s*auth\.uid\(\)/i);
 assert.match(sql,/role\s+in\s*\('admin','coach'\)/i);
 assert.match(sql,/leader_profile\.team\s*=\s*player_profile\.team/i);
});

test('parents pending anonymous and cross-team users receive no chat policy',()=>{
 const sql=chatMigration();
 assert.doesNotMatch(sql,/role\s+in\s*\([^)]*parent/i);
 assert.doesNotMatch(sql,/role\s+in\s*\([^)]*pending/i);
 assert.doesNotMatch(sql,/to anon/i);
 assert.match(sql,/leader_profile\.team\s*=\s*player_profile\.team/i);
});

test('messages and reads enforce sender and reader identity',()=>{
 const sql=chatMigration();
 assert.match(sql,/sender_profile_id\s*=\s*auth\.uid\(\)/i);
 assert.match(sql,/reader_profile_id\s*=\s*auth\.uid\(\)/i);
 assert.match(sql,/unique\s*\(message_id,\s*reader_profile_id\)/i);
});

test('conversation history survives player archival',()=>{
 const sql=chatMigration();
 assert.match(sql,/player_id uuid not null references public\.players\(id\) on delete restrict/i);
 assert.doesNotMatch(sql,/player_chat_messages[\s\S]{0,300}on delete cascade[\s\S]{0,300}players/i);
});
