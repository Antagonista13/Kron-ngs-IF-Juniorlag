const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
test('compact leader development assets are cache bumped',()=>{
 assert.match(html,/leader-development-dashboard\.css\?v=3/);
 assert.match(html,/coach-development-worklist\.js\?v=5/);
});
