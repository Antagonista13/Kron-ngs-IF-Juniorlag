const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const loader=fs.readFileSync('team-page-content.js','utf8');
const publicProfile=fs.readFileSync('player-public-profile-v2.js','utf8');

test('public player profile features are loaded from team page controller',()=>{
  assert.match(loader,/player-public-profile-v2\.js\?v=1/);
  assert.match(loader,/player-public-about\.js\?v=1/);
  assert.match(loader,/loadPlayerProfileFeatures/);
});

test('public player profile is large and personal',()=>{
  assert.match(publicProfile,/width:190px;height:190px/);
  assert.match(publicProfile,/player-public-profile-signature/);
  assert.match(publicProfile,/player-public-profile-about/);
  assert.match(publicProfile,/OM MIG/);
  assert.match(publicProfile,/public_about_me/);
});

test('public profile only fetches public presentation fields, never development goals',()=>{
  assert.match(publicProfile,/full_name,shirt_number,position,team_role,public_about_me/);
  assert.doesNotMatch(publicProfile,/development_goals/);
  assert.doesNotMatch(publicProfile,/development_focus/);
  assert.doesNotMatch(publicProfile,/reflection/);
});

test('profile editor lets the player update own public about me',()=>{
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
