const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');

function read(path){return fs.readFileSync(path,'utf8');}

const source=read('admin-center.js');
const index=read('index.html');
const api=require('../admin-center.js');

test('Admincenter logic only activates for active admins',()=>{
  assert.equal(api.isActiveAdmin({role:'admin',is_active:true}),true);
  assert.equal(api.isActiveAdmin({role:'admin',is_active:false}),false);
  assert.equal(api.isActiveAdmin({role:'coach',is_active:true}),false);
  assert.equal(api.isActiveAdmin(null),false);
});

test('GitHub workflow states map to clear Admincenter labels',()=>{
  assert.deepEqual(api.githubStatusFromRun({status:'completed',conclusion:'success'}),{state:'green',label:'GRÖN'});
  assert.deepEqual(api.githubStatusFromRun({status:'completed',conclusion:'failure'}),{state:'red',label:'FEL'});
  assert.deepEqual(api.githubStatusFromRun({status:'in_progress',conclusion:null}),{state:'warning',label:'VARNING'});
  assert.deepEqual(api.githubStatusFromRun(null),{state:'unknown',label:'OKÄND'});
});

test('SportAdmin run states map success/failure/unknown',()=>{
  assert.equal(api.syncStatusFromRun({status:'success'}).label,'GRÖN');
  assert.equal(api.syncStatusFromRun({status:'failure'}).label,'FEL');
  assert.equal(api.syncStatusFromRun(null).label,'OKÄND');
});

test('Admincenter asset and manual sync action are wired exactly once',()=>{
  assert.equal((index.match(/admin-center\.js/g)||[]).length,1);
  assert.match(index,/ADMINCENTER/);
  assert.match(index,/KÖR SPORTADMIN-SYNK NU/);
  assert.match(source,/functions\.invoke\(['"]sportadmin-roster-sync['"]/);
});

test('browser Admincenter code exposes no privileged server secret',()=>{
  const serviceRoleKey=['SUPABASE','SERVICE','ROLE','KEY'].join('_');
  const syncKey=['SPORTADMIN','SYNC','KEY'].join('_');
  assert.equal(source.includes(serviceRoleKey),false);
  assert.equal(source.includes(syncKey),false);
  assert.doesNotMatch(source,/x-kronang-sync-key/);
});
