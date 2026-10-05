async function saveChallengeCompletion(db,profile,challengeId,completed,weekChallengeIds){
  if(!profile||profile.role!=='player'||!profile.id||!challengeId)throw new Error('Endast en inloggad spelare kan markera sin utmaning.');
  let result;
  if(completed)result=await db.from('challenge_completions').insert({challenge_id:challengeId,player_id:profile.id});
  else{let query=db.from('challenge_completions').delete();query=weekChallengeIds&&weekChallengeIds.length?query.in('challenge_id',weekChallengeIds):query.eq('challenge_id',challengeId);result=await query.eq('player_id',profile.id);}
  if(result.error&&!(completed&&result.error.code==='23505'))throw new Error(result.error.message||'Det gick inte att spara.');
}
function challengePermissions(){if(typeof window!=='undefined'&&window.KronangPermissions)return window.KronangPermissions;if(typeof require==='function')return require('./role-permissions.js');return null;}
function canManageTeamChallenge(role){const p=challengePermissions();return Boolean(p&&p.canManageTeamContent(role));}
function canViewTeamChallenge(role){const p=challengePermissions();return Boolean(p&&p.canViewWeeklyChallenge(role));}
function shouldRefreshChallengeForAuthEvent(eventName,session){if(eventName==='SIGNED_OUT')return true;return eventName==='SIGNED_IN'&&Boolean(session&&session.user);}
function shouldOpenChallengeEditorFromHome(role){return canManageTeamChallenge(role);}
function validateTeamChallenge(title,instruction){const cleanTitle=String(title||'').trim(),cleanInstruction=String(instruction||'').trim();if(!cleanTitle)return{valid:false,message:'Skriv en rubrik.'};if(!cleanInstruction)return{valid:false,message:'Skriv en instruktion.'};return{valid:true,title:cleanTitle.toLocaleUpperCase('sv-SE'),instruction:cleanInstruction};}
function buildTeamChallengeViewModel(row){if(!row)return null;return{id:row.id||'',title:row.title||'',instruction:row.instruction||'',completed:Boolean(row.completed),createdAt:row.created_at||null,completedAt:row.completed_at||null};}
function setTeamChallengeEditorOpen(manager,form,open){if(!manager||!form)return;form.hidden=!open;manager.classList.toggle('team-editor-focus-open',Boolean(open));}
function clearHomeChallengeEditorBinding(){const card=document.getElementById('homeChallengeCard');if(!card)return;if(card._kronangChallengeEditorClick){card.removeEventListener('click',card._kronangChallengeEditorClick,true);delete card._kronangChallengeEditorClick;}if(card._kronangChallengeEditorKeydown){card.removeEventListener('keydown',card._kronangChallengeEditorKeydown,true);delete card._kronangChallengeEditorKeydown;}card.removeAttribute('data-leader-challenge-editor');}
function wireHomeChallengeEditor(profile){clearHomeChallengeEditorBinding();if(!shouldOpenChallengeEditorFromHome(profile&&profile.role))return;const card=document.getElementById('homeChallengeCard');if(!card)return;const openEditor=function(event){if(event&&event.target&&event.target.closest&&event.target.closest('#challengeButton'))return;if(event){event.preventDefault();event.stopImmediatePropagation();}const teamNav=document.querySelector('.nav-item[data-page="teamPage"]');if(teamNav)teamNav.click();const manager=document.getElementById('teamChallengeManager');if(!manager)return;const form=manager.querySelector('#teamChallengeForm'),title=manager.querySelector('#teamChallengeTitle');setTeamChallengeEditorOpen(manager,form,true);setTimeout(()=>{if(title)title.focus();},0);};const clickHandler=function(event){openEditor(event);};const keyHandler=function(event){if(event.key==='Enter'||event.key===' '){openEditor(event);}};card._kronangChallengeEditorClick=clickHandler;card._kronangChallengeEditorKeydown=keyHandler;card.setAttribute('data-leader-challenge-editor','1');card.setAttribute('aria-label','Ändra veckans utmaning');card.addEventListener('click',clickHandler,true);card.addEventListener('keydown',keyHandler,true);}
function clearChallengeUserState(){challengeUserGeneration++;clearHomeChallengeEditorBinding();const status=document.getElementById('challengeStatus');if(status)status.textContent='';const manager=document.getElementById('teamChallengeManager');if(manager)manager.remove();const button=document.getElementById('challengeButton');if(button){button.hidden=true;button.disabled=false;button.onclick=null;button.textContent='JAG ÄR KLAR ✓';}}
let challengeUserGeneration=0;
function renderChallengeHome(model,profile){
 const card=document.querySelector('#homePage .card.challenge');if(!card)return;
 if(profile&&canViewTeamChallenge(profile.role))card.hidden=false;
 const title=card.querySelector('h2'),text=card.querySelector('p'),button=card.querySelector('#challengeButton');
 let status=card.querySelector('#challengeStatus');if(!status){status=document.createElement('p');status.id='challengeStatus';status.setAttribute('aria-live','polite');card.appendChild(status);}
 status.textContent='';
 if(!model){if(title)title.textContent='INGEN AKTIV UTMANING';if(text)text.textContent='Tränaren har inte lagt ut någon utmaning ännu.';if(button)button.hidden=true;return;}
 if(title)title.textContent=model.title;if(text)text.textContent=model.instruction;if(!button)return;
 if(!profile||profile.role!=='player'){button.hidden=true;button.onclick=null;return;}
 const progress=window.KronangChallengeProgress;
 if(model.createdAt&&progress&&progress.challengeWeek(model.createdAt)?.key!==progress.challengeWeek(new Date())?.key){button.hidden=true;status.textContent='Utmaningen är avslutad. Se din historik under Profil.';return;}
 button.hidden=false;button.disabled=false;button.textContent=model.completed?'ÅNGRA MARKERING':'JAG ÄR KLAR ✓';
 status.textContent=model.completed?'✓ Klar'+(model.completedAt?' · '+new Date(model.completedAt).toLocaleDateString('sv-SE',{day:'numeric',month:'long',timeZone:'Europe/Stockholm'}):''):'';
 const generation=challengeUserGeneration;
 button.onclick=async function(event){
  if(event)event.stopPropagation();if(button.disabled)return;
  if(model.createdAt&&progress&&progress.challengeWeek(model.createdAt)?.key!==progress.challengeWeek(new Date())?.key){renderChallengeHome(model,profile);return;}
  button.disabled=true;button.textContent='SPARAR...';status.textContent='';
  try{
   await saveChallengeCompletion(window.kronangSupabase,profile,model.id,!model.completed,model.weekChallengeIds);
   if(generation!==challengeUserGeneration)return;
   model.completed=!model.completed;model.completedAt=model.completed?new Date().toISOString():null;
   renderChallengeHome(model,profile);
   document.dispatchEvent(new CustomEvent('kronang:challenge-changed',{detail:{playerId:profile.id}}));
   await updateChallengeProfileCount(profile);
  }catch(error){
   if(generation!==challengeUserGeneration)return;
   button.disabled=false;button.textContent=model.completed?'ÅNGRA MARKERING':'JAG ÄR KLAR ✓';
   status.textContent='Det gick inte att spara. Försök igen.';
   console.error('Kunde inte spara utmaningen:',error);
  }
 };
}
function renderChallengeManager(profile,current){const existing=document.getElementById('teamChallengeManager');if(existing)existing.remove();if(!canManageTeamChallenge(profile&&profile.role))return;const page=document.getElementById('teamPage');if(!page)return;const manager=document.createElement('section');manager.id='teamChallengeManager';manager.className='card team-focus-manager team-leader-tool';manager.innerHTML=`<button type="button" id="openTeamChallengeManager">ÄNDRA VECKANS UTMANING</button><div id="teamChallengeForm" hidden><label for="teamChallengeTitle">Rubrik</label><input id="teamChallengeTitle" maxlength="160" placeholder="Exempel: 1000 touches"><label for="teamChallengeInstruction">Instruktion</label><textarea id="teamChallengeInstruction" rows="4" maxlength="1000" placeholder="Beskriv utmaningen..."></textarea><div class="team-post-form-actions"><button type="button" id="saveTeamChallenge">SPARA UTMANING</button><button type="button" id="cancelTeamChallenge">AVBRYT</button></div><p id="teamChallengeMessage"></p></div>`;const actions=document.getElementById('teamLeaderToolsActions');if(actions)actions.appendChild(manager);else{const focusManager=document.getElementById('teamFocusManager');if(focusManager)focusManager.insertAdjacentElement('afterend',manager);else page.querySelector('.page-heading').insertAdjacentElement('afterend',manager);}const form=manager.querySelector('#teamChallengeForm'),title=manager.querySelector('#teamChallengeTitle'),instruction=manager.querySelector('#teamChallengeInstruction');if(current){title.value=current.title||'';instruction.value=current.instruction||'';}manager.querySelector('#openTeamChallengeManager').onclick=()=>{setTeamChallengeEditorOpen(manager,form,true);setTimeout(()=>title.focus(),0);};manager.querySelector('#cancelTeamChallenge').onclick=()=>{setTeamChallengeEditorOpen(manager,form,false);};manager.querySelector('#saveTeamChallenge').onclick=async function(){const check=validateTeamChallenge(title.value,instruction.value),message=manager.querySelector('#teamChallengeMessage');if(!check.valid){message.textContent=check.message;return;}this.disabled=true;let error;
const progress=window.KronangChallengeProgress;
if(current&&progress&&progress.challengeWeek(current.created_at)?.key===progress.challengeWeek(new Date())?.key){
 ({error}=await window.kronangSupabase.from('team_challenges').update({title:check.title,instruction:check.instruction}).eq('id',current.id).eq('team',profile.team));
}else{
 const archived=await window.kronangSupabase.from('team_challenges').update({active:false}).eq('team',profile.team).eq('active',true);
 error=archived.error;
 if(!error)({error}=await window.kronangSupabase.from('team_challenges').insert({team:profile.team,title:check.title,instruction:check.instruction,created_by:profile.id,active:true}));
}
this.disabled=false;if(error){console.error('Kunde inte spara veckans utmaning:',error);message.textContent='Det gick inte att spara utmaningen.';return;}setTeamChallengeEditorOpen(manager,form,false);await loadTeamChallenge(profile);document.dispatchEvent(new CustomEvent('kronang:challenge-changed'));};}
async function updateChallengeProfileCount(profile){if(!profile||profile.role!=='player')return;const{count,error}=await window.kronangSupabase.from('challenge_completions').select('id',{count:'exact',head:true}).eq('player_id',profile.id);if(error)return;const stat=document.querySelector('#profilePage .profile-stats .stat-card:first-child strong');if(stat)stat.textContent=String(count||0);}
async function loadTeamChallenge(profile){
 const generation=challengeUserGeneration;
 if(!profile||!canViewTeamChallenge(profile.role)){clearChallengeUserState();const card=document.getElementById('homeChallengeCard');if(card)card.hidden=true;return;}
 const db=window.kronangSupabase;
 const{data:challenge,error}=await db.from('team_challenges').select('id,title,instruction,active,created_at').eq('team',profile.team).eq('active',true).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(generation!==challengeUserGeneration)return;
 if(error){console.error('Kunde inte hämta veckans utmaning:',error);renderChallengeHome(null,profile);const status=document.getElementById('challengeStatus');if(status)status.textContent='Utmaningen kunde inte hämtas. Försök igen.';return;}
 let completed=false,completedAt=null,weekChallengeIds=challenge?[challenge.id]:[];
 if(challenge&&profile.role==='player'){
  const range=window.KronangChallengeProgress.challengeWeekRange(challenge.created_at);
  const week=await db.from('team_challenges').select('id').eq('team',profile.team).gte('created_at',range.start).lt('created_at',range.end);
  if(generation!==challengeUserGeneration)return;
  if(!week.error)weekChallengeIds=(week.data||[]).map(r=>r.id);
  const completion=week.error?{error:week.error}:await db.from('challenge_completions').select('id,completed_at').in('challenge_id',weekChallengeIds).eq('player_id',profile.id).order('completed_at',{ascending:false}).limit(1).maybeSingle();
  if(generation!==challengeUserGeneration)return;
  if(completion.error){renderChallengeHome(null,profile);const status=document.getElementById('challengeStatus');if(status)status.textContent='Din utmaningsstatus kunde inte hämtas. Försök igen.';return;}
  completed=Boolean(completion.data);completedAt=completion.data&&completion.data.completed_at;
 }
 const model=challenge?buildTeamChallengeViewModel({...challenge,completed,completed_at:completedAt}):null;
 if(model)model.weekChallengeIds=weekChallengeIds;
 renderChallengeHome(model,profile);renderChallengeManager(profile,challenge);wireHomeChallengeEditor(profile);await updateChallengeProfileCount(profile);
}
async function setupTeamChallenge(){const generation=challengeUserGeneration;if(!window.kronangSupabase)return;const{data:sessionData}=await window.kronangSupabase.auth.getSession();if(generation!==challengeUserGeneration)return;if(!sessionData.session){clearChallengeUserState();return;}const{data:profile}=await window.kronangSupabase.from('profiles').select('id, role, team').eq('id',sessionData.session.user.id).maybeSingle();if(generation!==challengeUserGeneration)return;if(profile&&profile.team)loadTeamChallenge(profile);}
function handleChallengeAuthChange(eventName,session){if(!shouldRefreshChallengeForAuthEvent(eventName,session))return;clearChallengeUserState();if(eventName==='SIGNED_IN')setupTeamChallenge();}
function waitForTeamChallenge(){if(!window.kronangSupabase){setTimeout(waitForTeamChallenge,100);return;}setupTeamChallenge();window.addEventListener('focus',setupTeamChallenge);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setupTeamChallenge();});document.addEventListener('kronang:auth-signed-in',function(event){handleChallengeAuthChange('SIGNED_IN',event.detail&&event.detail.session);});document.addEventListener('kronang:auth-signed-out',function(){handleChallengeAuthChange('SIGNED_OUT',null);});}
if(typeof module!=='undefined'&&module.exports)module.exports={saveChallengeCompletion,canManageTeamChallenge,canViewTeamChallenge,validateTeamChallenge,buildTeamChallengeViewModel,shouldRefreshChallengeForAuthEvent,shouldOpenChallengeEditorFromHome};
if(typeof window!=='undefined'&&typeof document!=='undefined')waitForTeamChallenge();
