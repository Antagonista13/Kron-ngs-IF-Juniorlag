const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');

test('player profile loads the redesigned profile controller and stylesheet',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(html,/player-profile-redesign\.css\?v=2/);
  assert.match(html,/player-profile-redesign\.js\?v=1/);
});

test('redesign builds a personal player hero and removes passive stat tiles',()=>{
  const source=fs.readFileSync(path.join(root,'player-profile-redesign.js'),'utf8');
  assert.match(source,/playerProfileHero/);
  assert.match(source,/shirt_number/);
  assert.match(source,/position/);
  assert.match(source,/team_role/);
  assert.match(source,/profile-stats/);
  assert.match(source,/hidden\s*=\s*true/);
});

test('goal and team card share a compact two-column grid and team card opens editor',()=>{
  const source=fs.readFileSync(path.join(root,'player-profile-redesign.js'),'utf8');
  const about=fs.readFileSync(path.join(root,'player-public-about.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'player-profile-redesign.css'),'utf8');
  assert.match(source,/playerProfileQuickGrid/);
  assert.match(source,/playerPublicAboutCard/);
  assert.match(about,/playerAboutEdit/);
  assert.match(about,/card\.addEventListener\(['"]click['"]/);
  assert.match(about,/setEditing\(card,true\)/);
  assert.match(css,/grid-template-columns\s*:\s*repeat\(2,minmax\(0,1fr\)\)/);
});

test('focus card is compact and account card stays outside the quick grid',()=>{
  const source=fs.readFileSync(path.join(root,'player-profile-redesign.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'player-profile-redesign.css'),'utf8');
  assert.match(source,/profileFocusCard/);
  assert.match(source,/profileGoalCard/);
  assert.match(css,/#profileFocusCard[^}]*padding\s*:\s*16px/);
  assert.doesNotMatch(source,/profileAccountCard[^\n]*appendChild\(quickGrid\)/);
});
