(function(){
function summaryText(card){
  const role=card.querySelector('[data-field="role"]');
  const active=card.querySelector('[data-field="active"]');
  if(!role)return'';
  const roleLabel=role.options[role.selectedIndex]?role.options[role.selectedIndex].textContent:role.value;
  let detail='';
  if(role.value==='player'){
    const player=card.querySelector('[data-field="player"]');
    const text=player&&player.options[player.selectedIndex]?player.options[player.selectedIndex].textContent:'';
    const shirt=(text.match(/#\d+/)||[])[0]||'';
    if(shirt)detail=' · '+shirt;
  }
  return roleLabel+detail+' · '+(active&&active.checked?'Aktiv ✓':'Inaktiv');
}
function collapseCard(card){
  const editor=card.querySelector('.admin-user-editor');
  const summary=card.querySelector('.admin-user-summary');
  if(editor)editor.hidden=true;
  if(summary){summary.hidden=false;const meta=summary.querySelector('.admin-user-summary-meta');if(meta)meta.textContent=summaryText(card);}
  card.classList.add('admin-user-compact');
}
function expandCard(card){
  const editor=card.querySelector('.admin-user-editor');
  const summary=card.querySelector('.admin-user-summary');
  if(summary)summary.hidden=true;
  if(editor)editor.hidden=false;
  card.classList.remove('admin-user-compact');
}
function decorate(card){
  if(!card||card.dataset.compactReady==='1'||card.classList.contains('locked'))return;
  const role=card.querySelector('[data-field="role"]');
  const save=card.querySelector('[data-action="save"]');
  if(!role||!save)return;
  card.dataset.compactReady='1';
  const head=card.querySelector('.admin-user-head');
  const editor=document.createElement('div');
  editor.className='admin-user-editor';
  let node=head&&head.nextSibling;
  while(node){const next=node.nextSibling;editor.appendChild(node);node=next;}
  const summary=document.createElement('div');
  summary.className='admin-user-summary';
  const meta=document.createElement('span');meta.className='admin-user-summary-meta';meta.textContent=summaryText(card);
  const edit=document.createElement('button');edit.type='button';edit.dataset.action='edit';edit.className='admin-user-edit';edit.textContent='REDIGERA ›';
  edit.addEventListener('click',()=>expandCard(card));
  summary.append(meta,edit);
  card.append(summary,editor);
  collapseCard(card);
  const observer=new MutationObserver(()=>{if(save.textContent.trim().startsWith('SPARAT'))collapseCard(card);});
  observer.observe(save,{childList:true,subtree:true,characterData:true});
}
function scan(){document.querySelectorAll('#adminUsers .admin-user-card[data-user-id]').forEach(decorate);}
if(typeof document!=='undefined'){
  const start=()=>{scan();const host=document.getElementById('adminUsers');if(host){new MutationObserver(scan).observe(host,{childList:true});}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#openAdminPage'))setTimeout(scan,80);});
}
if(typeof module!=='undefined'&&module.exports)module.exports={summaryText};
})();
