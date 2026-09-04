const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const development=fs.readFileSync('development.js','utf8');
const style=fs.readFileSync('style.css','utf8');

test('development area cards use monochrome svg line icons instead of emojis',()=>{
  assert.doesNotMatch(development,/⚽|🧠|⚡|🔥/);
  assert.match(development,/data-development-area-icon="technique"/);
  assert.match(development,/data-development-area-icon="game-understanding"/);
  assert.match(development,/data-development-area-icon="physical"/);
  assert.match(development,/data-development-area-icon="mentality"/);
  assert.match(development,/<svg[^>]*viewBox="0 0 24 24"/);
  assert.match(style,/\.development-icon svg/);
  assert.match(style,/stroke:\s*currentColor/);
  assert.match(style,/fill:\s*none/);
});
