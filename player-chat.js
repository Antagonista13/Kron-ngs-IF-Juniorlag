(function(root){
let closeActive=null;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function roleLabel(role){return role==='admin'?'Admin':role==='coach'?'Ledare':'Spelare';}
function timeLabel(value){try{return new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}catch{return'';}}
async function open(opts){opts=opts||{};let playerId=opts.playerId;if(!playerId&&root.KronangPlayerChatData)playerId=await root.KronangPlayerChatData.ownPlayerId();if(!playerId)return;
 if(closeActive)closeActive();
 let overlay=document.getElementById('playerChatOverlay');if(overlay)overlay.remove();overlay=el('div','player-chat-overlay');overlay.id='playerChatOverlay';const dialog=el('section','player-chat-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
 const head=el('header','player-chat-header'),titles=el('div');titles.append(el('strong','',opts.playerName||'Meddelanden'),el('small','','Privat dialog mellan spelaren och ledarstaben'));const close=el('button','player-chat-close','×');close.type='button';close.setAttribute('aria-label','Stäng');head.append(titles,close);
 const list=el('div','player-chat-list');list.setAttribute('aria-live','polite');const form=el('form','player-chat-form'),input=el('textarea','player-chat-input'),send=el('button','player-chat-send','SKICKA'),status=el('p','player-chat-status');input.maxLength=2000;input.rows=2;input.placeholder='Skriv ett meddelande…';send.type='submit';form.append(input,send);dialog.append(head,list,form,status);overlay.append(dialog);document.body.append(overlay);
 list.append(el('p','player-chat-loading','Hämtar meddelanden…'));
 let stopped=false,timer=null,refreshing=null,ownerId=null,lastRows=null,displayed=false;
 const live=()=>!stopped&&overlay.isConnected&&!document.hidden;
 function dispose(){if(stopped)return;stopped=true;root.clearInterval(timer);root.removeEventListener('focus',wake);document.removeEventListener('visibilitychange',wake);document.removeEventListener('kronang:auth-signed-out',dispose);overlay.remove();if(closeActive===dispose)closeActive=null;}
 function wake(){if(live())render();}
 const render=()=>{
  if(!live())return Promise.resolve();if(refreshing)return refreshing;
  refreshing=(async()=>{try{
   const {data:{user},error}=await root.kronangSupabase.auth.getUser();if(error)throw error;
   if(!live())return;if(!user||(ownerId&&ownerId!==user.id)){dispose();return;}ownerId=user.id;
   const rows=await root.KronangPlayerChatData.listMessages(playerId);if(!live())return;
   const check=await root.kronangSupabase.auth.getUser();if(!live())return;if(check.error)throw check.error;if(check.data.user?.id!==ownerId){dispose();return;}
   const signature=JSON.stringify(rows);if(signature===lastRows)return;
   const nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<80,scroll=list.scrollTop;
   list.replaceChildren();if(!rows.length)list.append(el('p','player-chat-empty','Inga meddelanden ännu. Skriv gärna först.'));
   for(const m of rows){const own=ownerId===m.sender_profile_id;const bubble=el('article','player-chat-bubble '+(own?'is-own':'is-other'));const meta=el('div','player-chat-meta');meta.append(el('strong','',m.sender?.full_name||roleLabel(m.sender?.role)),el('span','',roleLabel(m.sender?.role)+' · '+timeLabel(m.created_at)));bubble.append(meta,el('p','',m.body));list.append(bubble);}
   displayed=true;list.scrollTop=lastRows===null||nearBottom?list.scrollHeight:scroll;
   if(!live())return;await root.KronangPlayerChatData.markConversationRead(playerId,rows.map(m=>m.id));if(!live())return;
   lastRows=signature;root.dispatchEvent(new CustomEvent('kronang:player-chat-read',{detail:{playerId}}));
  }catch(err){if(live()){if(!displayed)list.replaceChildren(el('p','player-chat-error','Kunde inte hämta meddelanden.'));console.error(err);}}})().finally(()=>{refreshing=null;});
  return refreshing;
 };
 closeActive=dispose;close.addEventListener('click',dispose);overlay.addEventListener('click',e=>{if(e.target===overlay)dispose();});
 root.addEventListener('focus',wake);document.addEventListener('visibilitychange',wake);document.addEventListener('kronang:auth-signed-out',dispose);
 timer=root.setInterval(wake,3000);
 form.addEventListener('submit',async e=>{e.preventDefault();const draft=input.value;const v=root.KronangPlayerChatData.validateMessage(draft);if(!v.ok){status.textContent=v.error;return;}send.disabled=true;status.textContent='';try{await root.KronangPlayerChatData.sendMessage(playerId,v.body);input.value='';if(refreshing)await refreshing;await render();root.dispatchEvent(new CustomEvent('kronang:player-chat-sent',{detail:{playerId}}));}catch(err){input.value=draft;status.textContent='Kunde inte skicka. Ditt meddelande finns kvar.';console.error(err);}finally{send.disabled=false;}});
 await render();if(live())input.focus();
}
const api={open,roleLabel,timeLabel};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.KronangPlayerChat=api;
})(typeof window!=='undefined'?window:null);
