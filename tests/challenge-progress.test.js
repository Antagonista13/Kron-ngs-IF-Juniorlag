const test = require('node:test');
const assert = require('node:assert/strict');
const { challengeWeek, challengeWeekRange, buildChallengeProgress, challengeProgressHtml, fetchChallengeProgressData } = require('../challenge-progress.js');
const profile = { id:'p1', created_at:'2026-08-01T00:00:00Z' };
const challenge = (id,date,active=false,title=id) => ({id,created_at:date,active,title});
const done = (id,date='2026-09-30T12:00:00Z',player='p1') => ({challenge_id:id,player_id:player,completed_at:date});
const now = '2026-10-05T22:00:00+02:00';

test('challenge weeks use Stockholm midnight including year and DST boundaries', () => {
  assert.equal(challengeWeek('2026-10-04T21:59:59Z').key,'2026-09-28');
  assert.equal(challengeWeek('2026-10-04T22:00:00Z').key,'2026-10-05');
  assert.deepEqual(challengeWeek('2027-01-01T12:00:00Z'),{key:'2026-12-28',number:53,year:2026});
  assert.equal(challengeWeek('2026-10-25T23:00:00Z').key,'2026-10-26');
});

test('weekly database bounds include the Stockholm daylight saving change',()=>{
  assert.deepEqual(challengeWeekRange('2026-10-20T12:00:00Z'),{start:'2026-10-18T22:00:00.000Z',end:'2026-10-25T23:00:00.000Z'});
});

test('completed weeks count once and the ongoing week is not missed', () => {
  const rows=[challenge('old','2026-09-28T10:00:00Z'),challenge('edited','2026-09-29T10:00:00Z'),challenge('missed','2026-09-21T10:00:00Z'),challenge('current','2026-10-05T10:00:00Z',true)];
  const p=buildChallengeProgress(rows,[done('old'),done('old'),done('missed',undefined,'p2')],profile,{now});
  assert.equal(p.completed,1); assert.equal(p.total,2); assert.equal(p.percent,50); assert.equal(p.pending,1);
  assert.equal(p.history.length,3); assert.equal(p.history[0].status,'ongoing');
  assert.equal(p.history[1].status,'completed'); assert.equal(p.history[1].title,'edited');
  assert.equal(p.history[2].status,'missed');
});

test('completing this week updates the ring immediately', () => {
  const p=buildChallengeProgress([challenge('c','2026-10-05T10:00:00Z',true)],[done('c','2026-10-05T12:00:00Z')],profile,{now});
  assert.equal(p.completed,1); assert.equal(p.total,1); assert.equal(p.percent,100);
  assert.equal(p.history[0].completedAt,'2026-10-05T12:00:00Z');
});

test('period selection and account start exclude unassigned older challenges', () => {
  const rows=[challenge('before','2026-08-03T10:00:00Z'),challenge('september','2026-09-07T10:00:00Z'),challenge('last','2026-09-28T10:00:00Z')];
  const p=buildChallengeProgress(rows,[],{id:'p1',created_at:'2026-09-01T00:00:00Z'},{now,weeks:4});
  assert.deepEqual(p.history.map(x=>x.id),['last']);
  assert.equal(buildChallengeProgress(rows,[],{id:'p1',created_at:'2026-09-01T00:00:00Z'},{now,weeks:0}).total,2);
});

test('no settled challenges is an empty state, not zero percent failure', () => {
  const p=buildChallengeProgress([challenge('c','2026-10-05T10:00:00Z',true)],[],profile,{now});
  assert.equal(p.percent,null); assert.equal(p.total,0); assert.equal(p.pending,1);
  assert.match(challengeProgressHtml(p),/Pågår/);
  assert.match(challengeProgressHtml(p),/Ingen avslutad utmaning/);
});

test('history escapes user supplied titles and includes completion dates', () => {
  const p=buildChallengeProgress([challenge('c','2026-09-28T10:00:00Z',false,'<img onerror="evil()">')],[done('c')],profile,{now});
  const html=challengeProgressHtml(p);
  assert.doesNotMatch(html,/<img onerror/); assert.match(html,/&lt;img/); assert.match(html,/30 sep/);
});

function dataDb(rows,errorTable){
  const requests=[];
  return {requests,from(table){const filters=[];const query={select:()=>query,order:()=>query,eq:(key,value)=>{filters.push([key,value]);return query;},in:(key,value)=>{filters.push([key,value]);return query;},range:async(start,end)=>{requests.push({table,filters});return{data:(rows[table]||[]).slice(start,end+1),error:table===errorTable?{message:'offline'}:null};}};return query;}};
}
test('player statistics request only their own completions and team assignments',async()=>{
  const db=dataDb({team_challenges:[],challenge_completions:[]});
  await fetchChallengeProgressData(db,{...profile,role:'player',team:'Juniorlag'});
  assert.deepEqual(db.requests.map(r=>[r.table,r.filters]),[['team_challenges',[['team','Juniorlag']]],['challenge_completions',[['player_id','p1']]]]);
});
test('leader statistics use active players of their own team',async()=>{
  const db=dataDb({profiles:[{id:'p1'}],team_challenges:[],challenge_completions:[]});
  await fetchChallengeProgressData(db,{id:'coach',role:'coach',team:'Juniorlag'});
  assert.deepEqual(db.requests.find(r=>r.table==='profiles').filters,[['role','player'],['team','Juniorlag'],['is_active',true]]);
  assert.deepEqual(db.requests.find(r=>r.table==='challenge_completions').filters,[['player_id',['p1']]]);
});
test('failed reads do not turn into misleading zero statistics',async()=>{
  const db=dataDb({},'challenge_completions');
  await assert.rejects(fetchChallengeProgressData(db,{...profile,role:'player',team:'Juniorlag'}),/offline/);
});
test('parents and pending accounts cannot load challenge statistics',async()=>{
  const db=dataDb({});
  await assert.rejects(fetchChallengeProgressData(db,{id:'parent',role:'parent',team:'Juniorlag'}),/behörighet/);
  assert.equal(db.requests.length,0);
});
