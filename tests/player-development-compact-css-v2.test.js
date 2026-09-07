const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('compact rules reduce spacing and identify selected history tab',()=>{const css=fs.readFileSync('player-development-compact.css','utf8');assert.match(css,/development-card\{padding:16px 18px/);assert.match(css,/button\[aria-selected="true"\]/);assert.match(css,/@media\(max-width:560px\)/);});
