const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function app(ready=Promise.resolve()){
 const nodes=new Map(),listeners=new Map(),roster=[];
 function element(id=''){
  const n={id,isConnected:true,children:[],dataset:{},textContent:'',className:'',setAttribute(){},addEventListener(){},
   appendChild(child){child.parentNode=this;this.children.push(child);if(child.id)nodes.set(child.id,child);},
   remove(){nodes.delete(this.id);if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);},
   querySelector(s){if(s==='select')return this.select;if(s==='.challenge-progress-content')return this.content;return this.children.find(x=>x.className==='challenge-roster-stat')||null;}};
  Object.defineProperty(n,'innerHTML',{set(value){this.html=value;if(value.includes('challenge-progress-content')){this.select={value:'0',addEventListener(){}};this.content={innerHTML:'',textContent:''};}},get(){return this.html;}});return n;
 }
 const document={getElementById:id=>nodes.get(id)||null,createElement:()=>element(),querySelector(s){return roster.find(n=>s.includes('data-profile-id="'+n.dataset.profileId+'"'))||null;},querySelectorAll(){return[];},addEventListener(type,fn){listeners.set(type,fn);}};
 for(const id of ['profile-one','profile-two','coachDevelopmentView'])nodes.set(id,element(id));
 for(const id of ['p1','p2']){const n=element();n.dataset.profileId=id;n.closest=()=>n;roster.push(n);}
 const now=new Date().toISOString(),records={profiles:[{id:'p1',role:'player',team:'KIF',is_active:true},{id:'p2',role:'player',team:'KIF',is_active:true}],team_challenges:[{id:'c',title:'Löp',created_at:now}],challenge_completions:[{player_id:'p1',challenge_id:'c',completed_at:now}]};
 const db={auth:{getSession:async()=>{await ready;return{data:{session:{user:{id:'admin'}}}};}},from(table){const q={select(){return q;},eq(){return q;},order(){return q;},in(){return q;},range(){return q;},maybeSingle:async()=>({data:{id:'admin',role:'admin',team:'KIF',is_active:true}}),then(resolve){return Promise.resolve({data:records[table]||[],error:null}).then(resolve);}};return q;}};
 const window={document,kronangSupabase:db,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('challenge-progress.js','utf8'),{window,document,console,Date,Intl,setInterval(){},setTimeout(){}});
 return{nodes,roster,emit:(type,detail)=>listeners.get(type)?.({detail})};
}
const settle=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setImmediate(r));};
test('new development profile mounts the selected linked player diagram and clears it on back',async()=>{
 const a=app();await settle();
 a.emit('kronang:development-player-opened',{profileId:'p1',container:a.nodes.get('profile-one')});await settle();
 let card=a.nodes.get('coachChallengeProgress');assert.ok(card,'Diagram missing in the new development profile');
 assert.equal(card.parentNode,a.nodes.get('profile-one'));assert.match(card.content.innerHTML,/100%/);
 a.emit('kronang:development-player-opened',{profileId:'p2',container:a.nodes.get('profile-two')});await settle();
 card=a.nodes.get('coachChallengeProgress');assert.equal(card.parentNode,a.nodes.get('profile-two'));assert.doesNotMatch(card.content.innerHTML,/100%/);
 a.emit('kronang:development-player-closed');assert.equal(a.nodes.has('coachChallengeProgress'),false);
});
test('new roster buttons show weekly status using profile ID rather than roster ID',async()=>{
 const a=app();await settle();a.emit('kronang:development-roster-ready');
 assert.match(a.roster[0].children[0]?.textContent||'',/Veckan klar/);
 assert.match(a.roster[1].children[0]?.textContent||'',/Veckan pågår/);
});

test('opening a profile before statistics authentication finishes still mounts its diagram',async()=>{
 let release;const ready=new Promise(r=>{release=r;});const a=app(ready);
 a.emit('kronang:development-player-opened',{profileId:'p1',container:a.nodes.get('profile-one')});release();await settle();
 assert.ok(a.nodes.get('coachChallengeProgress'),'An early open must not be lost');
});

test('a late response from a closed profile cannot replace the visible player diagram',async()=>{
 const a=app();await settle();const old=a.nodes.get('profile-one'),current=a.nodes.get('profile-two');
 a.emit('kronang:development-player-opened',{profileId:'p2',container:current});
 const card=a.nodes.get('coachChallengeProgress');old.isConnected=false;
 a.emit('kronang:development-player-opened',{profileId:'p1',container:old});
 assert.equal(a.nodes.get('coachChallengeProgress'),card);assert.equal(card.parentNode,current);
});
