const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('compact stylesheet is loaded for player development',()=>{const html=fs.readFileSync('index.html','utf8');assert.match(html,/player-development-compact\.css\?v=1/);assert.match(html,/player-development-layout\.js\?v=3/);});
