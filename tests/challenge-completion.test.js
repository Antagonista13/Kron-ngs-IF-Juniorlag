const test=require('node:test');
const assert=require('node:assert/strict');
const {saveChallengeCompletion}=require('../team-challenge.js');
const vm=require('node:vm'),fs=require('node:fs');
function home(db,completed=false){
  const button={hidden:false,disabled:false,textContent:'',setAttribute(){}};
  const status={textContent:'',setAttribute(){}};
  const title={textContent:''},text={textContent:''};
  const card={querySelector:s=>s==='h2'?title:s==='p'?text:s==='#challengeButton'?button:s==='#challengeStatus'?status:null,appendChild(){}};
  const events=[];
  const context=vm.createContext({console:{error(){}},Date,setTimeout(){},module:{exports:{}},require,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options&&options.detail;}}});
  vm.runInContext(fs.readFileSync('team-challenge.js','utf8'),context);
  context.window={kronangSupabase:db,KronangPermissions:require('../role-permissions.js')};
  context.document={querySelector:s=>s==='#homePage .card.challenge'?card:null,getElementById:id=>id==='challengeStatus'?status:null,dispatchEvent:event=>events.push(event),createElement:()=>status};
  context.renderChallengeHome({id:'c1',title:'TEST',instruction:'Träna',completed},{id:'p1',role:'player'});
  return{button,status,events};
}

test('completing and undoing persist against the signed in player and challenge',async()=>{
  const calls=[];
  const db={from(table){assert.equal(table,'challenge_completions');const q={
    insert(row){calls.push(['insert',row]);return Promise.resolve({error:null});},
    delete(){calls.push(['delete']);return q;},
    eq(field,value){calls.push(['eq',field,value]);return q;},
    then(resolve){return Promise.resolve({error:null}).then(resolve);}
  };return q;}};
  await saveChallengeCompletion(db,{id:'p1',role:'player'},'c1',true);
  await saveChallengeCompletion(db,{id:'p1',role:'player'},'c1',false);
  assert.deepEqual(calls,[['insert',{challenge_id:'c1',player_id:'p1'}],['delete'],['eq','challenge_id','c1'],['eq','player_id','p1']]);
});

test('save failures propagate and duplicate completion is idempotent',async()=>{
  const db={from:()=>({insert:async()=>({error:{code:'42501',message:'denied'}})})};
  await assert.rejects(saveChallengeCompletion(db,{id:'p1',role:'player'},'c',true),/denied/);
  db.from=()=>({insert:async()=>({error:{code:'23505',message:'duplicate'}})});
  await saveChallengeCompletion(db,{id:'p1',role:'player'},'c',true);
});

test('undo removes the players marks on every revision of that week',async()=>{
  const calls=[];const q={eq:(key,value)=>{calls.push([key,value]);return q;},in:(key,value)=>{calls.push([key,value]);return q;},then:resolve=>Promise.resolve({error:null}).then(resolve)};
  await saveChallengeCompletion({from:()=>({delete:()=>q})},{id:'p1',role:'player'},'current',false,['old','current']);
  assert.deepEqual(calls,[['challenge_id',['old','current']],['player_id','p1']]);
});

test('leaders and missing player IDs cannot submit player completions',async()=>{
  const db={from(){throw new Error('must not query');}};
  await assert.rejects(saveChallengeCompletion(db,{id:'coach',role:'coach'},'c',true),/spelare/);
  await assert.rejects(saveChallengeCompletion(db,{role:'player'},'c',true),/spelare/);
});

test('a failed completion leaves the button usable and shows an error',async()=>{
  const db={from:()=>({insert:async()=>({error:{message:'offline'}})})};
  const a=home(db);await a.button.onclick({stopPropagation(){}});
  assert.equal(a.button.disabled,false);assert.match(a.button.textContent,/JAG ÄR KLAR/);
  assert.match(a.status.textContent,/inte.*spara/i);assert.equal(a.events.length,0);
});

test('a completed challenge can be undone and notifies statistics after saving',async()=>{
  let deleted=false;const query={eq:()=>query,then:resolve=>Promise.resolve({error:null}).then(resolve)};
  const db={from:()=>({delete(){deleted=true;return query;},select(){return{eq:()=>Promise.resolve({count:0,error:null})};}})};
  const a=home(db,true);assert.equal(a.button.disabled,false);assert.match(a.button.textContent,/ÅNGRA/);
  await a.button.onclick({stopPropagation(){}});
  assert.equal(deleted,true);assert.match(a.button.textContent,/JAG ÄR KLAR/);
  assert.equal(a.events[0].type,'kronang:challenge-changed');
});
