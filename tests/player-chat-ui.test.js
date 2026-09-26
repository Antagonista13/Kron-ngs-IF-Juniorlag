const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
test('chat UI exposes open API and safe text rendering contract',()=>{const s=fs.readFileSync('player-chat.js','utf8');assert.match(s,/KronangPlayerChat/);assert.match(s,/textContent/);assert.doesNotMatch(s,/message\.body[^\n]{0,80}innerHTML/);});
test('chat submit disables while sending and preserves draft on failure',()=>{const s=fs.readFileSync('player-chat.js','utf8');assert.match(s,/send\.disabled\s*=\s*true/);assert.match(s,/catch\s*\(/);assert.match(s,/input\.value\s*=\s*draft/);});
test('chat stylesheet provides unread badge and mobile dialog',()=>{const s=fs.readFileSync('player-chat.css','utf8');assert.match(s,/player-chat-unread/);assert.match(s,/player-chat-dialog/);});
