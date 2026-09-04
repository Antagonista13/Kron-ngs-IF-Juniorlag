const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const development=fs.readFileSync('development.js','utf8');

test('development area cards use monochrome svg line icons instead of emojis',()=>{
  assert.doesNotMatch(development,/⚽|🧠|⚡|🔥/);
  assert.match(development,/data-development-area-icon="technique"/);
  assert.match(development,/data-development-area-icon="game-understanding"/);
  assert.match(development,/data-development-area-icon="physical"/);
  assert.match(development,/data-development-area-icon="mentality"/);
  assert.match(development,/<svg[^>]*viewBox="0 0 24 24"/);
  assert.match(development,/stroke="currentColor"/);
  assert.match(development,/fill="none"/);
});
