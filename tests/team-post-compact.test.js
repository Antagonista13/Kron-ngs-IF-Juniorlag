const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const compact=require('../team-post-compact.js');

const css=fs.readFileSync(path.join(__dirname,'..','team-posts.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'..','team-post-compact.js'),'utf8');

test('team post preview keeps short text and truncates long text',()=>{
  assert.equal(compact.teamPostPreview('Kort meddelande',80),'Kort meddelande');
  const preview=compact.teamPostPreview('A'.repeat(120),80);
  assert.equal(preview.length,81);
  assert.match(preview,/…$/);
});

test('team post cards support compact and expanded states',()=>{
  assert.match(js,/team-post-preview/);
  assert.match(js,/dataset\.action='toggle'/);
  assert.match(js,/team-post-expanded/);
  assert.match(css,/\.team-posts-list \.team-post\{[^}]*padding:/);
  assert.match(css,/\.team-post-preview\{[^}]*display:-webkit-box/);
  assert.match(css,/\.team-post-manage button\{[^}]*min-height:32px/);
});
