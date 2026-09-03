const assert = require('assert');
const fs = require('fs');
const seed = fs.readFileSync('supabase/migrations/202609030006_seed_players.sql','utf8');
assert.ok(seed.includes('insert into public.players'));
['personnummer','adress','målsman','allergi','@'].forEach(term => {
  assert.ok(!seed.toLowerCase().includes(term), 'seed must not contain '+term);
});
console.log('player seed privacy tests passed');
