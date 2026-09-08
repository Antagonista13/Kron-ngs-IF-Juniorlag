(function(root){
function roleLabel(value){return value==='captain'?'KAPTEN':value==='vice_captain'?'VICEKAPTEN':'';}
function ensureQuickGrid(page){
  let quickGrid=document.getElementById('playerProfileQuickGrid');
  if(!quickGrid){quickGrid=document.createElement('section');quickGrid.id='playerProfileQuickGrid';quickGrid.className='player-profile-quick-grid';}
  const focus=document.getElementById('profileFocusCard');
  if(!quickGrid.parentElement){if(focus)focus.insertAdjacentElement('afterend',quickGrid);else page.appendChild(quickGrid);}
  const goal=document.getElementById('profileGoalCard');
  const about=document.getElementById('playerPublicAboutCard');
  if(goal&&goal.parentElement!==quickGrid)quickGrid.appendChild(goal);
  if(about&&about.parentElement!==quickGrid)quickGrid.appendChild(about);
  return quickGrid;
}
function hidePassiveStats(page){const stats=page.querySelector('.profile-stats');if(stats){stats.hidden=true;stats.style.display='none';}}
function buildHero(page,player){
  const header=page.querySelector('.profile-header');if(!header)return;
  header.id='playerProfileHero';header.classList.add('player-profile-hero');
  const heading=header.querySelector('h2');if(heading)heading.textContent=player.full_name||'Min profil';
  const subtitle=header.querySelector('#profileSubtitle');
  if(subtitle){subtitle.innerHTML='';
    const number=document.createElement('strong');number.className='player-profile-number';number.textContent=player.shirt_number!==null&&player.shirt_number!==undefined?'#'+player.shirt_number:'';
    const position=document.createElement('span');position.className='player-profile-position';position.textContent=player.position||'Spelare';
    const role=roleLabel(player.team_role);const roleNode=document.createElement('span');roleNode.className='player-profile-role';roleNode.textContent=role;
    if(number.textContent)subtitle.appendChild(number);subtitle.appendChild(position);if(role)subtitle.appendChild(roleNode);
  }
}
function organize(page){hidePassiveStats(page);ensureQuickGrid(page);}
async function setup(){
  if(!root.kronangSupabase)return;
  const page=document.getElementById('profilePage');if(!page)return;
  const sessionResult=await root.kronangSupabase.auth.getSession();const user=sessionResult.data&&sessionResult.data.session?sessionResult.data.session.user:null;if(!user)return;
  const profileResult=await root.kronangSupabase.from('profiles').select('role').eq('id',user.id).maybeSingle();if(!profileResult.data||profileResult.data.role!=='player')return;
  const playerResult=await root.kronangSupabase.from('players').select('full_name,shirt_number,position,team_role').eq('profile_id',user.id).eq('is_active',true).maybeSingle();
  if(playerResult.data)buildHero(page,playerResult.data);
  organize(page);
  document.addEventListener('kronang:player-about-ready',()=>organize(page));
  if(root.MutationObserver)new root.MutationObserver(()=>organize(page)).observe(page,{childList:true});
}
function wait(){if(root.kronangSupabase){setup().catch(error=>console.error('Spelarprofil:',error));return;}setTimeout(wait,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={roleLabel};
if(root.document)wait();
})(typeof window!=='undefined'?window:globalThis);
