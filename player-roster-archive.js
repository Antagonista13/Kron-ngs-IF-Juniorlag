function getArchiveActionLabel(isActive){return isActive?'Ta bort från appen':'Återaktivera';}
const PLAYER_ARCHIVE_CONFIRM_TEXT='Spelaren tas bara bort från appen. SportAdmin påverkas inte och spelarens historik sparas. Vill du fortsätta?';

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
    if(button.textContent.trim()==='Ta bort från truppen')button.textContent=getArchiveActionLabel(true);
  });
}

function shouldConfirmPlayerArchive(target){
  return Boolean(target&&target.closest&&target.closest('[data-roster-active]')&&['Ta bort från appen','Ta bort från truppen'].includes((target.textContent||'').trim()));
}

function setupPlayerArchiveUx(){
  if(typeof document==='undefined')return;
  const refresh=()=>relabelPlayerArchiveUi(document);
  document.addEventListener('click',event=>{
    const button=event.target&&event.target.closest?event.target.closest('button'):null;
    if(!shouldConfirmPlayerArchive(button))return;
    if(!window.confirm(PLAYER_ARCHIVE_CONFIRM_TEXT)){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);
  refresh();
  if(typeof MutationObserver!=='undefined')new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
}

if(typeof module!=='undefined'&&module.exports)module.exports={getArchiveActionLabel,PLAYER_ARCHIVE_CONFIRM_TEXT,shouldConfirmPlayerArchive};
if(typeof window!=='undefined'&&typeof document!=='undefined')setupPlayerArchiveUx();
