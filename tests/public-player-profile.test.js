const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const loader=fs.readFileSync('team-page-content.js','utf8');
const publicProfile=fs.readFileSync('player-public-profile-v2.js','utf8');
const vm=require('node:vm');

test('team controller loads public profile features once with current cache versions',()=>{
  const ids=new Map(),scripts=[];
  const append=node=>{ids.set(node.id,node);if(node.src)scripts.push(node.src);};
  const doc={getElementById:id=>ids.get(id),createElement:()=>({}),body:{appendChild:append},head:{appendChild:append}};
  const {loadPlayerProfileFeatures}=require('../team-page-content.js');
  loadPlayerProfileFeatures(doc);loadPlayerProfileFeatures(doc);
  assert.deepEqual(scripts,['player-public-profile-v2.js?v=6','player-public-about.js?v=2','admin-player-card-edit.js?v=15']);
});

test('public player profile is large and personal',()=>{
  assert.match(publicProfile,/width:190px;height:190px/);
  assert.match(publicProfile,/player-public-profile-signature/);
  assert.match(publicProfile,/player-public-profile-about/);
  assert.match(publicProfile,/OM MIG/);
  assert.match(publicProfile,/public_about_me/);
});

test('opening a public profile only requests public presentation fields',async()=>{
  const requests=[],events={};
  const query={select:fields=>{requests.push(fields);return query;},eq:()=>query,maybeSingle:async()=>({data:null,error:null})};
  const document={getElementById:()=>null,createElement:()=>({}),head:{appendChild(){}},querySelector:()=>({}),addEventListener:(name,fn)=>events[name]=fn};
  const window={kronangSupabase:{from:table=>{assert.equal(table,'players');return query;}}};
  vm.runInContext(publicProfile,vm.createContext({window,document,setTimeout:fn=>fn()}));
  events.click({target:{closest:()=>({getAttribute:()=> 'Öppna spelarprofil för Testspelare'})}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(requests,['id,full_name,nickname,shirt_number,position,team_role,public_about_me']);
});

test('profile editor saves the signed-in players public bio and updates its preview',async()=>{
  const requests=[],elements=new Map();
  function element(){return {hidden:false,textContent:'',value:'',events:{},addEventListener(name,fn){this.events[name]=fn;},focus(){}};}
  const preview=element(),textarea=element(),edit=element(),cancel=element(),status=element(),submit=element(),form=element();
  form.hidden=true;form.querySelector=()=>submit;
  const children={'#playerAboutPreview':preview,textarea,form,'#playerAboutEdit':edit,'[data-about-cancel]':cancel,'[data-about-status]':status};
  const card=element();card.querySelector=selector=>children[selector]||null;
  const page={appendChild(node){elements.set(node.id,node);}};
  const document={readyState:'loading',getElementById:id=>id==='profilePage'?page:elements.get(id),createElement:tag=>tag==='section'?card:{},head:{appendChild(node){elements.set(node.id,node);}},dispatchEvent(){},addEventListener(name,fn){this.ready=fn;}};
  const db={auth:{getSession:async()=>({data:{session:{user:{id:'player1'}}},error:null})},from(table){const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:table==='profiles'?{role:'player'}:{public_about_me:'Min tidigare text'},error:null})};return q;},rpc:async(name,payload)=>{requests.push([name,JSON.parse(JSON.stringify(payload))]);return {data:null,error:null};}};
  const window={document,kronangSupabase:db};
  vm.runInContext(fs.readFileSync('player-public-about.js','utf8'),vm.createContext({window,document,CustomEvent:class{},setTimeout:fn=>fn()}));
  document.ready();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(preview.textContent,'Min tidigare text');
  edit.events.click({stopPropagation(){}});assert.equal(form.hidden,false);
  textarea.value='Min nya text';
  await form.events.submit({preventDefault(){},stopPropagation(){}});
  assert.deepEqual(requests,[['save_my_public_about',{p_about:'Min nya text'}]]);
  assert.equal(preview.textContent,'Min nya text');assert.equal(form.hidden,true);assert.equal(submit.disabled,false);
});

test('database migration provides public bio and player-owned save rpc',()=>{
  const sql=fs.readFileSync('supabase/migrations/202609080001_player_public_about.sql','utf8');
  assert.match(sql,/public_about_me text/);
  assert.match(sql,/save_my_public_about/);
  assert.match(sql,/auth\.uid\(\)/);
  assert.match(sql,/profile_id = auth\.uid\(\)/);
});
