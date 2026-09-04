function accountLinkLabel(role){return role==='player'?'Koppla kontot till':'';}
function accountLinkHelp(role){return role==='player'?'Välj personen i spelartruppen som detta konto tillhör.':'';}
function normalizeAccountName(value){return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('sv-SE');}
function suggestPlayerForAccount(accountName,players){const target=normalizeAccountName(accountName);if(!target)return'';const matches=(players||[]).filter(player=>normalizeAccountName(player.full_name)===target);return matches.length===1?String(matches[0].id||''):'';}
function enhancePlayerField(card){
 if(!card)return;const role=card.querySelector('[data-field="role"]'),field=card.querySelector('[data-player-field]'),select=card.querySelector('[data-field="player"]');if(!role||!field||!select||role.value!=='player')return;
 const text=field.firstChild;if(text&&text.nodeType===3)text.textContent=accountLinkLabel('player');
 if(!field.querySelector('.admin-player-link-help')){const help=document.createElement('small');help.className='admin-player-link-help';help.textContent=accountLinkHelp('player');field.insertBefore(help,select);}
 if(select.value||select.dataset.suggestionTried==='true')return;select.dataset.suggestionTried='true';const name=card.querySelector('.admin-user-head strong'),target=normalizeAccountName(name&&name.textContent);if(!target)return;
 const exact=Array.from(select.options).filter(option=>option.value&&normalizeAccountName(String(option.textContent||'').replace(/\s+#\d+\s*$/,''))===target);
 if(exact.length===1){select.value=exact[0].value;const note=document.createElement('small');note.className='admin-player-link-suggestion';note.textContent='Föreslagen automatiskt utifrån namnet – kontrollera och spara.';field.appendChild(note);}
}
function enhanceAdminAccountLinking(root){const scope=root||document;scope.querySelectorAll('[data-pending-id], [data-user-id]').forEach(enhancePlayerField);}
function startAdminAccountLinking(){const page=document.getElementById('adminPage');if(!page)return;const headings=page.querySelectorAll('.admin-section > h3');headings.forEach(h=>{if(h.textContent.trim()==='Godkännanden')h.textContent='Väntar på åtkomst';});const observer=new MutationObserver(()=>enhanceAdminAccountLinking(page));observer.observe(page,{childList:true,subtree:true});page.addEventListener('change',event=>{if(event.target&&event.target.matches('[data-field="role"]'))enhancePlayerField(event.target.closest('[data-pending-id], [data-user-id]'));});enhanceAdminAccountLinking(page);}
const api={accountLinkLabel,accountLinkHelp,suggestPlayerForAccount,normalizeAccountName};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined'){window.KronangAdminAccountLinking=api;if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startAdminAccountLinking);else startAdminAccountLinking();}}
