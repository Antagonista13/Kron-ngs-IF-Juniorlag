(function(root){
'use strict';
function challengeWeek(value){
  const d=new Date(value);if(Number.isNaN(d.getTime()))return null;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const part=k=>Number(parts.find(p=>p.type===k).value);
  const monday=new Date(Date.UTC(part('year'),part('month')-1,part('day')));
  monday.setUTCDate(monday.getUTCDate()-(monday.getUTCDay()+6)%7);
  const thursday=new Date(monday);thursday.setUTCDate(thursday.getUTCDate()+3);
  const year=thursday.getUTCFullYear();
  const first=new Date(Date.UTC(year,0,4));first.setUTCDate(first.getUTCDate()-(first.getUTCDay()+6)%7);
  return {key:monday.toISOString().slice(0,10),number:1+Math.round((monday-first)/604800000),year};
}
function challengeWeekRange(value){
  const week=challengeWeek(value);if(!week)return null;
  const boundary=key=>{
    const noon=new Date(key+'T12:00:00Z');
    const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',hour:'2-digit',hourCycle:'h23'}).format(noon));
    return new Date(Date.parse(key+'T00:00:00Z')-(hour-12)*3600000).toISOString();
  };
  const next=new Date(week.key+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+7);
  return {start:boundary(week.key),end:boundary(next.toISOString().slice(0,10))};
}
function buildChallengeProgress(challenges,completions,profile,options){
  options=options||{};const now=options.now||new Date(),current=challengeWeek(now);
  const weeks=Number(options.weeks)||0;
  const cutoff=new Date(current.key+'T12:00:00Z');cutoff.setUTCDate(cutoff.getUTCDate()-Math.max(0,weeks-1)*7);
  const cutoffKey=cutoff.toISOString().slice(0,10),groups=new Map();
  for(const row of challenges||[]){
    const week=challengeWeek(row.created_at);if(!week||week.key>current.key||(weeks&&week.key<cutoffKey))continue;
    if(!groups.has(week.key))groups.set(week.key,{week,rows:[]});groups.get(week.key).rows.push(row);
  }
  const history=[];
  for(const {week,rows} of groups.values()){
    rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));const row=rows[0];
    const ids=new Set(rows.map(r=>r.id));
    const done=(completions||[]).filter(c=>c.player_id===profile.id&&ids.has(c.challenge_id)&&c.completed_at).sort((a,b)=>new Date(b.completed_at)-new Date(a.completed_at))[0];
    const joined=profile.created_at?new Date(profile.created_at):null;
    if(joined&&new Date(row.created_at)<joined&&!done&&!(row.active&&week.key===current.key))continue;
    const status=done?'completed':week.key===current.key?'ongoing':'missed';
    history.push({id:row.id,week:week.number,year:week.year,weekKey:week.key,title:row.title||'Utmaning',status,completedAt:done?done.completed_at:null});
  }
  history.sort((a,b)=>b.weekKey.localeCompare(a.weekKey));
  const completed=history.filter(r=>r.status==='completed').length,pending=history.filter(r=>r.status==='ongoing').length,total=history.length-pending;
  return {history,completed,pending,total,percent:total?Math.round(completed/total*100):null,current:history.find(r=>r.weekKey===current.key)||null};
}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function dateLabel(value){return new Date(value).toLocaleDateString('sv-SE',{day:'numeric',month:'short',timeZone:'Europe/Stockholm'});}
function challengeProgressHtml(model){
  const percent=model.percent,labels={completed:'✓ Klar',ongoing:'Pågår',missed:'Ej genomförd'};
  const history=model.history.map(r=>`<li><div><small>Vecka ${r.week} · ${r.year}</small><strong>${esc(r.title)}</strong></div><span class="challenge-state ${r.status}">${labels[r.status]}${r.completedAt?`<small>${esc(dateLabel(r.completedAt))}</small>`:''}</span></li>`).join('');
  return `<div class="challenge-progress-summary"><div class="challenge-progress-ring" style="--progress:${percent??0}%" role="img" aria-label="${percent===null?'Ingen avslutad utmaning':percent+' procent genomförda utmaningar'}"><strong>${percent===null?'–':percent+'%'}</strong></div><div><strong>${model.total?model.completed+' av '+model.total+' utmaningar klara':'Ingen avslutad utmaning ännu'}</strong><p>${model.pending?'Veckans utmaning pågår.':'Följ dina genomförda utmaningar.'}</p></div></div><p class="challenge-progress-note">Pågående utmaningar räknas inte som missade. En utmaning per vecka.</p><details ${model.history.length?'':'open'}><summary>Utmaningshistorik</summary>${history?'<ul class="challenge-progress-history">'+history+'</ul>':'<p>Historiken fylls på när du får utmaningar.</p>'}</details>`;
}
async function readRows(query){
  const rows=[];
  for(let offset=0;;offset+=500){const result=await query.range(offset,offset+499);if(result.error)throw new Error(result.error.message||'Statistiken kunde inte hämtas.');rows.push(...(result.data||[]));if((result.data||[]).length<500)return rows;}
}
async function fetchChallengeProgressData(db,profile){
  if(!profile||!profile.id||!profile.team||!['player','coach','admin'].includes(profile.role))throw new Error('Du saknar behörighet att se utmaningsstatistik.');
  const [challenges,players]=await Promise.all([
    readRows(db.from('team_challenges').select('id,title,active,created_at').eq('team',profile.team).order('created_at',{ascending:false}).order('id')),
    profile.role==='player'?Promise.resolve([profile]):readRows(db.from('profiles').select('id,full_name,created_at').eq('role','player').eq('team',profile.team).eq('is_active',true).order('id'))
  ]);
  const completions=[];
  if(profile.role==='player')completions.push(...await readRows(db.from('challenge_completions').select('challenge_id,player_id,completed_at').eq('player_id',profile.id).order('id')));
  else for(let i=0;i<players.length;i+=200)completions.push(...await readRows(db.from('challenge_completions').select('challenge_id,player_id,completed_at').in('player_id',players.slice(i,i+200).map(p=>p.id)).order('id')));
  return {challenges,completions,players};
}
const api={challengeWeek,challengeWeekRange,buildChallengeProgress,challengeProgressHtml,fetchChallengeProgressData};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.KronangChallengeProgress=api;
if(root.document){
  let viewer=null,data=null,generation=0,selected=null,selectedMount=null;
  function clear(){generation++;viewer=null;data=null;selected=null;selectedMount=null;document.querySelectorAll('.challenge-progress-card,.challenge-roster-stat').forEach(n=>n.remove());}
  function card(id,mount,label){
    let node=document.getElementById(id);if(node)return node;
    node=document.createElement('section');node.id=id;node.className='card challenge-progress-card';
    node.innerHTML='<div class="challenge-progress-heading"><h3>'+esc(label)+'</h3><label>Period<select aria-label="Period för utmaningsstatistik"><option value="4">Fyra veckor</option><option value="8">Åtta veckor</option><option value="0" selected>Hela historiken</option></select></label></div><div class="challenge-progress-content" aria-live="polite"></div>';
    mount.appendChild(node);node.querySelector('select').addEventListener('change',()=>renderCard(node));return node;
  }
  function renderCard(node){
    const player=node.id==='playerChallengeProgress'?viewer:data&&data.players.find(p=>p.id===selected);
    if(!data||!player){node.querySelector('.challenge-progress-content').textContent=!selected&&node.id==='coachChallengeProgress'?'Spelaren saknar ett kopplat spelarkonto för utmaningsstatistik.':data?'Utmaningsstatistik saknas för den här spelaren.':'Hämtar utmaningsstatistik...';return;}
    node.querySelector('.challenge-progress-content').innerHTML=challengeProgressHtml(buildChallengeProgress(data.challenges,data.completions,player,{weeks:Number(node.querySelector('select').value)}));
  }
  function render(){
    if(!viewer||!data)return;
    if(viewer.role==='player'){
      const page=document.getElementById('profilePage');if(!page)return;
      const node=card('playerChallengeProgress',page,'Mina utmaningar');node.setAttribute('data-player-profile-section','');renderCard(node);
    }else{
      for(const player of data.players){
        const button=document.querySelector('.development-player-open[data-profile-id="'+player.id+'"]')||document.querySelector('.coach-player-button[data-player-id="'+player.id+'"]');if(!button)continue;
        const mount=button.querySelector('.development-player-card-main')||button.closest('.coach-roster-player')||button.parentNode;
        let summary=mount.querySelector('.challenge-roster-stat[data-challenge-player="'+player.id+'"]');
        if(!summary){summary=document.createElement('span');summary.className='challenge-roster-stat';summary.dataset.challengePlayer=player.id;mount.appendChild(summary);}
        const model=buildChallengeProgress(data.challenges,data.completions,player);
        const state=model.current?(model.current.status==='completed'?'Veckan klar ✓':model.current.status==='ongoing'?'Veckan pågår':'Ej genomförd'):'Ingen utmaning denna vecka';
        summary.textContent=state+' · '+model.completed+' av '+model.total+' klara'+(model.percent===null?'':' · '+model.percent+' %');
      }
      if(selected||selectedMount){const mount=selectedMount||document.getElementById('coachDevelopmentView');if(!mount)return;const node=card('coachChallengeProgress',mount,'Spelarens utmaningar');const header=mount.querySelector('.development-workflow-profile > header');if(header)header.after(node);renderCard(node);}
    }
  }
  async function refresh(){
    const request=++generation;
    try{
      const db=root.kronangSupabase;if(!db)return;
      const session=await db.auth.getSession();if(request!==generation)return;
      const user=session.data&&session.data.session&&session.data.session.user;if(!user){clear();return;}
      const result=await db.from('profiles').select('id,role,team,created_at,is_active').eq('id',user.id).maybeSingle();
      if(request!==generation)return;
      if(result.error)throw new Error(result.error.message);
      const profile=result.data;if(!profile||!profile.is_active||!['player','coach','admin'].includes(profile.role)){clear();return;}
      if(viewer&&(viewer.id!==profile.id||viewer.role!==profile.role||viewer.team!==profile.team)){clear();return refresh();}
      viewer=profile;
      const loaded=await fetchChallengeProgressData(db,profile);if(request!==generation)return;
      data=loaded;render();
    }catch(error){
      if(request!==generation)return;data=null;
      document.querySelectorAll('.challenge-progress-content').forEach(n=>{n.textContent='Statistiken kunde inte hämtas. Öppna profilen igen för att försöka på nytt.';});
      document.querySelectorAll('.challenge-roster-stat').forEach(n=>{n.textContent='Utmaningsstatistiken kunde inte hämtas.';});
      if(viewer&&viewer.role==='player'){const page=document.getElementById('profilePage');if(page)card('playerChallengeProgress',page,'Mina utmaningar').querySelector('.challenge-progress-content').textContent='Statistiken kunde inte hämtas. Försök igen.';}
      console.error('Utmaningsstatistik:',error);
    }
  }
  root.addEventListener('focus',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
  setInterval(render,60000);
  document.addEventListener('kronang:challenge-changed',refresh);
  document.addEventListener('kronang:coach-roster-ready',render);
  document.addEventListener('kronang:development-roster-ready',render);
  document.addEventListener('kronang:development-player-opened',event=>{
    if(!event.detail?.container?.isConnected)return;
    if(viewer&&!['coach','admin'].includes(viewer.role))return;
    selected=event.detail.profileId||null;selectedMount=event.detail.container;
    document.getElementById('coachChallengeProgress')?.remove();
    if(!viewer){refresh();return;}
    const node=card('coachChallengeProgress',selectedMount,'Spelarens utmaningar');
    const header=selectedMount.querySelector('.development-workflow-profile > header');if(header)header.after(node);
    renderCard(node);if(!data)refresh();
  });
  document.addEventListener('kronang:development-player-closed',()=>{selected=null;selectedMount=null;document.getElementById('coachChallengeProgress')?.remove();});
  document.addEventListener('kronang:auth-signed-out',clear);
  document.addEventListener('kronang:auth-signed-in',()=>{clear();refresh();});
  document.addEventListener('click',event=>{
    const button=event.target.closest('.coach-player-button');
    if(button&&viewer&&['coach','admin'].includes(viewer.role)){selected=button.dataset.playerId;selectedMount=null;document.getElementById('coachChallengeProgress')?.remove();if(data)render();else refresh();}
    if(event.target.closest('.coach-player-page-back')){selected=null;selectedMount=null;document.getElementById('coachChallengeProgress')?.remove();}
    if(event.target.closest('.nav-item[data-page="profilePage"],.nav-item[data-page="developmentPage"]'))refresh();
  });
  function wait(){if(!root.kronangSupabase){setTimeout(wait,100);return;}refresh();}
  wait();
}
})(typeof window!=='undefined'?window:globalThis);
