const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
test('entrypoints keep chat hidden from parent and pending roles',()=>{const s=fs.readFileSync('player-chat-entrypoints.js','utf8');assert.match(s,/canUseOwnPlayerChat/);assert.match(s,/canUsePlayerChatAsLeader/);});
test('player public profile exposes canonical player id for chat',()=>{const s=fs.readFileSync('player-public-profile-v2.js','utf8');assert.match(s,/select\('id,/);assert.match(s,/dataset\.playerId/);});
test('unread module renders numeric count and hides zero',()=>{const s=fs.readFileSync('player-chat-unread.js','utf8');assert.match(s,/textContent\s*=\s*String\(count\)/);assert.match(s,/count\s*>\s*0/);});
