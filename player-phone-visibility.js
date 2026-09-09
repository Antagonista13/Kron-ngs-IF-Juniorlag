(function(root){
let rosterCache=null;
function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ensureOwnPhoneCard(){
  const page=document.getElementById('profilePage');if(!page)return null;
  let card=document.getElementById('playerPhonePrivacyCard');if(card)return card;
  card=document.createElement('section');card.id='playerPhonePrivacyCard';card.className='card';card.setAttribute('data-player-profile-section','');card.hidden=true;
  card.innerHTML='<h3>Mobilnummer</h3><p id="playerPhoneValue">Hämtar mobilnummer…</p><label for="playerPhoneVisibility"><strong>Vem får se mitt mobilnummer?</strong></label><select id="playerPhoneVisibility"><option value="hidden">Dolt</option><option value="coaches">Endast tränare</option><option value="team">Alla i laget</option></select><p id="playerPhoneVisibilityHelp">Dolt är standard. Admin kan alltid använda numret för administration.</p><p id="playerPhoneVisibilityMessage" aria-live="polite"></p>';
  const goal=document.getElementById('profileGoalCard');if(goal)goal.insertAdjacentElement('afterend',card);else page.appendChild(card);
  return card;
}
async function loadOwnPreference(){
  const card=ensureOwnPhoneCard();if(!card||!root.kronangSupabase)return;
  const session=await root.kronangSupabase.auth.getSession(),user=session.data&&session.data.session?session.data.session.user:null;if(!user)return;
  const profile=await root.kronangSupabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(!profile.data||profile.data.role!=='player'){card.hidden=true;card.style.display='none';return;}
  card.hidden=false;card.style.display='';
  const result=await root.kronangSupabase.rpc('get_my_phone_preference');
  const row=result.data&&result.data[0]?result.data[0]:null,value=document.getElementById('playerPhoneValue'),select=document.getElementById('playerPhoneVisibility');
  if(result.error){if(value)value.textContent='Mobilnumret kunde inte hämtas.';return;}
  if(value)value.textContent=row&&row.mobile_phone?row.mobile_phone:'Inget mobilnummer registrerat.';
  if(select){select.value=row&&row.visibility?row.visibility:'hidden';select.disabled=!(row&&row.mobile_phone);if(!select.dataset.ready){select.dataset.ready='1';select.addEventListener('change',saveOwnVisibility);}}
}
async function saveOwnVisibility(event){
  const select=event.currentTarget,message=document.getElementById('playerPhoneVisibilityMessage');select.disabled=true;if(message)message.textContent='Sparar…';
  const result=await root.kronangSupabase.rpc('update_my_phone_visibility',{p_visibility:select.value});
  select.disabled=false;if(result.error){if(message)message.textContent='Det gick inte att spara inställningen.';return;}if(message)message.textContent='Sparat ✓';setTimeout(function(){if(message)message.textContent='';},1600);
}
async function rosterRows(){
  if(rosterCache)return rosterCache;
  const result=await root.kronangSupabase.rpc('list_public_roster_players');
  rosterCache=result.data||[];return rosterCache;
}
function normalizeProfileName(text){return String(text||'').replace(/^#\d+\s*/,'').trim().toLocaleLowerCase('sv-SE');}
async function addVisiblePhoneToPublicProfile(profile){
  if(!profile||profile.dataset.phoneChecked==='1'||!root.kronangSupabase)return;profile.dataset.phoneChecked='1';
  const heading=profile.querySelector('h2');if(!heading)return;const targetName=normalizeProfileName(heading.textContent),rows=await rosterRows(),player=rows.find(function(row){return String(row.full_name||'').trim().toLocaleLowerCase('sv-SE')===targetName;});if(!player)return;
  const result=await root.kronangSupabase.rpc('get_visible_player_phone',{p_player_id:player.id}),row=result.data&&result.data[0]?result.data[0]:null;if(result.error||!row||!row.mobile_phone)return;
  const p=document.createElement('p');p.className='player-public-profile-phone';p.innerHTML='<strong>Mobil:</strong> <a href="tel:'+escapeHtml(String(row.mobile_phone).replace(/\s+/g,''))+'">'+escapeHtml(row.mobile_phone)+'</a>';profile.appendChild(p);
}
function observePublicProfiles(){
  document.querySelectorAll('.player-public-profile').forEach(addVisiblePhoneToPublicProfile);
  if(!root.MutationObserver)return;new root.MutationObserver(function(mutations){mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){if(node.nodeType!==1)return;if(node.matches&&node.matches('.player-public-profile'))addVisiblePhoneToPublicProfile(node);if(node.querySelectorAll)node.querySelectorAll('.player-public-profile').forEach(addVisiblePhoneToPublicProfile);});});}).observe(document.body,{childList:true,subtree:true});
}
function setup(){loadOwnPreference().catch(function(error){console.error('Mobilnummer:',error);});observePublicProfiles();document.addEventListener('kronang:access-state',function(){loadOwnPreference().catch(function(error){console.error('Mobilnummer:',error);});});}
function wait(){if(root.kronangSupabase&&root.document)setup();else root.setTimeout(wait,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={normalizeProfileName};
if(root.document)wait();
})(typeof window!=='undefined'?window:globalThis);
