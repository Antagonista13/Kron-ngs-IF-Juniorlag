const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const roster=fs.readFileSync('player-roster.js','utf8');
const html=fs.readFileSync('index.html','utf8');

test('public player profile is large, personal and excludes private development data',()=>{
  assert.match(roster,/player-public-profile-avatar\{width:190px;height:190px/);
  assert.match(roster,/player-public-profile-signature/);
  assert.match(roster,/player-public-profile-about/);
  assert.match(roster,/OM MIG/);
  assert.match(roster,/aboutMe/);
  assert.doesNotMatch(roster,/player-public-profile-goal/);
});

test('public player profile keeps role and captain marker visible',()=>{
  assert.match(roster,/player-public-profile-position/);
  assert.match(roster,/player-public-profile-role/);
  assert.match(roster,/formatTeamRole\(p\.teamRole\)/);
});

test('player roster loads public about me but not development goals',()=>{
  assert.match(roster,/public_about_me/);
  assert.match(roster,/shirt_number,position,team_role,is_active,profile_id,avatar_url,public_about_me/);
  assert.doesNotMatch(roster,/development_goals.*select/);
});

test('profile editor for own public about me is loaded',()=>{
  assert.match(html,/player-public-about\.js\?v=1/);
  const about=fs.readFileSync('player-public-about.js','utf8');
  assert.match(about,/Mitt lagkort/);
  assert.match(about,/Om mig/);
  assert.match(about,/save_my_public_about/);
});

test('database migration provides public bio and player-owned save rpc',()=>{
  const sql=fs.readFileSync('supabase/migrations/202609080001_player_public_about.sql','utf8');
  assert.match(sql,/public_about_me text/);
  assert.match(sql,/save_my_public_about/);
  assert.match(sql,/auth\.uid\(\)/);
  assert.match(sql,/profile_id = auth\.uid\(\)/);
});
