const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {leaderAboutPresentation}=require('../profile-role-view.js');

test('leader about presentation exposes editable own description',()=>{
  assert.deepEqual(leaderAboutPresentation({description:'  Jag gillar spelarutveckling.  ',hasStaffProfile:true}),{
    description:'Jag gillar spelarutveckling.',
    hasStaffProfile:true,
    canEdit:true
  });
  assert.deepEqual(leaderAboutPresentation({description:'',hasStaffProfile:false}),{
    description:'',
    hasStaffProfile:false,
    canEdit:false
  });
});

test('leader profile loads and saves only the signed in staff description',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','profile-role-view.js'),'utf8');
  assert.match(source,/\.eq\(['"]profile_id['"],\s*user\.id\)/);
  assert.match(source,/update_my_team_staff_description/);
  assert.match(source,/Om mig/);
});

test('database migration links team staff to auth profile and protects self update',()=>{
  const sql=fs.readFileSync(path.join(__dirname,'..','supabase','migrations','202609080910_link_team_staff_profiles.sql'),'utf8');
  assert.match(sql,/add column if not exists profile_id uuid/i);
  assert.match(sql,/references public\.profiles\(id\)/i);
  assert.match(sql,/create or replace function public\.update_my_team_staff_description/i);
  assert.match(sql,/auth\.uid\(\)/i);
  assert.match(sql,/profile_id = auth\.uid\(\)/i);
});

test('profile role view cache is bumped for leader about me',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(html,/profile-role-view\.js\?v=8/);
});
