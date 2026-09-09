function getArchiveActionLabel(isActive){return isActive?'Ta bort':'Återaktivera';}
const PLAYER_ARCHIVE_CONFIRM_TEXT='Spelaren tas bara bort från appen. SportAdmin påverkas inte och spelarens historik sparas. Vill du fortsätta?';
let selectedPlayerName='';

function cleanRosterName(value){return String(value||'').replace(/\s+\((K|VK)\)\s*$/,'').trim();}

function relabelPlayerArchiveUi(root){
  if(!root||!root.querySelector)return;
  const section=root.querySelector('#playerRosterSection')||(root.id==='playerRosterSection'?root:null);
  if(!section)return;
  const summary=section.querySelector('.player-roster-inactive summary');
  if(summary){
    const first=Array.from(summary.childNodes).find(node=>node.nodeType===3);
    if(first)first.nodeValue='Borttagna/arkiverade spelare ';
  }
  section.querySelectorAll('[data-roster-active] .player-roster-card-actions button').forEach(button=>{
    if(['Ta bort från truppen','Ta bort från appen','Ta bort'].includes(button.textContent.trim()))button.style.display='none';
  });
  section.querySelectorAll('[data-roster-active] .player-roster-card-title strong').forEach(name=>{
    name.style.cursor='pointer';
    name.style.textDecoration='underline';
    name.style.textUnderlineOffset='3px';
  });
}

async function injectProfileArchiveAction(){
  if(typeof document==='undefined'||!selectedPlayerName||!window.kronangSupabase)return;
  const profile=document.querySelector('.player-public-profile');
  if(!profile||profile.querySelector('.player-public-profile-archive')||profile.dataset.archiveLoading==='1')return;
  profile.dataset.archiveLoading='1';
  const {data,error}=await window.kronangSupabase.from('players').select('id,full_name,is_active').eq('full_name',selectedPlayerName).eq('is_active',true).maybeSingle();
  delete profile.dataset.archiveLoading;
  if(error||!data||!profile.isConnected)return;
  const button=document.createElement('button');
  button.type='button';
  button.className='player-public-profile-archive';
  button.textContent=getArchiveActionLabel(true);
  button.style.margin='10px auto 0';
  button.style.padding='8px 14px';
  button.style.border='1px solid #d76464';
  button.style.borderRadius='999px';
  button.style.background='transparent';
  button.style.color='#ff8b8b';
  button.style.fontWeight='800';
  button.onclick=async()=>{
    if(!window.confirm(PLAYER_ARCHIVE_CONFIRM_TEXT))return;
    button.disabled=true;
    button.textContent='Tar bort…';
    const {error:updateError}=await window.kronangSupabase.from('players').update({is_active:false,updated_at:new Date().toISOString()}).eq('id',data.id);
    if(updateError){
      button.disabled=false;
      button.textContent=getArchiveActionLabel(true);
      window.alert('Kunde inte ta bort spelaren från appen. Försök igen.');
      return;
    }
    window.location.reload();
  };
  const roleBadge=profile.querySelector('.player-public-profile-role');
  if(roleBadge)roleBadge.after(button);else profile.appendChild(button);
}

function setupPlayerArchiveUx(){
  if(typeof document==='undefined')return;
  const refresh=()=>{relabelPlayerArchiveUi(document);injectProfileArchiveAction();};
  document.addEventListener('click',event=>{
    const target=event.target&&event.target.closest?event.target.closest('.player-roster-card'):null;
    const activeCard=target&&target.closest('[data-roster-active]');
    if(!activeCard||!target.querySelector('.player-roster-card-actions'))return;
    if(event.target.closest('button,a,input,select,textarea,label'))return;
    const name=target.querySelector('.player-roster-card-title strong');
    selectedPlayerName=cleanRosterName(name&&name.textContent);
    setTimeout(injectProfileArchiveAction,0);
  },true);
  refresh();
  if(typeof MutationObserver!=='undefined')new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
}

if(typeof module!=='undefined'&&module.exports)module.exports={getArchiveActionLabel,PLAYER_ARCHIVE_CONFIRM_TEXT,cleanRosterName};
if(typeof window!=='undefined'&&typeof document!=='undefined')setupPlayerArchiveUx();
