(function(root){
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function navToTeam(){const b=document.querySelector('.nav-item[data-page="teamPage"]');if(b)b.click();}
function openPlayer(player){navToTeam();setTimeout(()=>{const card=document.querySelector('[data-player-id="'+CSS.escape(String(player.playerId))+'"]');if(card){card.scrollIntoView({behavior:'smooth',block:'center'});card.click();setTimeout(()=>root.KronangPlayerChatEntrypoints?.refresh(),100);}else root.KronangPlayerChat?.open({playerId:player.playerId,playerName:player.name});},120);}
function ensureInbox(){let o=document.getElementById('playerChatInboxOverlay');if(o)o.remove();o=el('div','player-chat-overlay');o.id='playerChatInboxOverlay';const d=el('section','player-chat-dialog player-chat-inbox-dialog');const h=el('header','player-chat-header'),t=el('div');t.append(el('strong','','Meddelanden'),el('small','','Olästa meddelanden från spelarna'));const x=el('button','player-chat-close','×');x.type='button';x.onclick=()=>o.remove();h.append(t,x);const list=el('div','player-chat-inbox-list');d.append(h,list);o.append(d);o.addEventListener('click',e=>{if(e.target===o)o.remove();});document.body.append(o);return{overlay:o,list};}
async function openInbox(){const ui=ensureInbox();ui.list.append(el('p','player-chat-loading','Hämtar meddelanden…'));try{const s=await root.KronangPlayerChatData.getUnreadSummary();ui.list.replaceChildren();if(!s.players.length){ui.list.append(el('p','player-chat-empty','Inga olästa meddelanden.'));return;}s.players.forEach(p=>{const b=el('button','player-chat-inbox-row');b.type='button';const copy=el('span');copy.append(el('strong','',p.name),el('small','',p.count+' '+(p.count===1?'oläst':'olästa')));b.append(copy,el('span','player-chat-unread',String(p.count)));b.onclick=()=>{ui.overlay.remove();root.KronangPlayerChat.open({playerId:p.playerId,playerName:p.name});};ui.list.append(b);});}catch(e){ui.list.replaceChildren(el('p','player-chat-error','Kunde inte hämta meddelanden.'));console.error(e);}}
function homeCard(){let card=document.getElementById('homePlayerChatCard');if(card)return card;const home=document.getElementById('homePage');if(!home)return null;card=el('section','card home-player-chat-card');card.id='homePlayerChatCard';card.hidden=true;card.setAttribute('role','button');card.tabIndex=0;card.innerHTML='<div class="home-chat-head"><strong>MEDDELANDEN</strong><span class="player-chat-unread" data-home-chat-count></span></div><h3 data-home-chat-title></h3><p data-home-chat-preview></p><span class="home-card-linkhint">Visa meddelanden →</span>';card.onclick=openInbox;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openInbox();}};const intro=home.querySelector('.home-intro');if(intro)intro.after(card);else home.prepend(card);return card;}
function teamBadge(){const nav=document.querySelector('.nav-item[data-page="teamPage"]');if(!nav)return null;let b=nav.querySelector('[data-team-chat-badge]');if(!b){b=el('i','nav-chat-unread');b.dataset.teamChatBadge='true';nav.append(b);}return b;}
let refreshVersion=0;
function clearUnread(){
 const card=document.getElementById('homePlayerChatCard');if(card){card.hidden=true;card.onclick=null;card.onkeydown=null;}
 document.querySelectorAll('[data-team-chat-badge],[data-player-chat-nav-badge]').forEach(b=>{b.hidden=true;b.textContent='';b.removeAttribute('aria-label');});
}
function playerBadge(){
 const nav=document.querySelector('.nav-item[data-page="developmentPage"]');if(!nav)return null;
 let b=nav.querySelector('[data-player-chat-nav-badge]');
 if(!b){b=el('i','nav-chat-unread');b.dataset.playerChatNavBadge='true';nav.append(b);}return b;
}
function showCount(b,count){if(!b)return;b.textContent=count?String(count):'';b.hidden=count===0;b.setAttribute('aria-label',count+' olästa meddelanden');}
async function refresh(){
 const version=++refreshVersion;
 if(!root.KronangPlayerChatData||!root.kronangSupabase){clearUnread();return;}
 try{
  const {data:u,error:ue}=await root.kronangSupabase.auth.getUser();if(ue)throw ue;
  let p=null;
  if(u.user){const {data,error}=await root.kronangSupabase.from('profiles').select('id,full_name,role,is_active').eq('id',u.user.id).maybeSingle();if(error)throw error;p=data;}
  if(version!==refreshVersion)return;
  if(!p?.is_active){clearUnread();return;}
  const perms=root.KronangPermissions;
  if(perms?.canUseOwnPlayerChat(p.role)){
   const id=await root.KronangPlayerChatData.ownPlayerId();
   const count=id?await root.KronangPlayerChatData.getUnreadCount(id):0;
   if(version!==refreshVersion)return;
   clearUnread();const card=homeCard(),badge=playerBadge();showCount(badge,count);
   if(card){
    card.hidden=count===0;
    if(count){
     const title='Du har '+count+' '+(count===1?'oläst meddelande':'olästa meddelanden');
     card.querySelector('[data-home-chat-title]').textContent=title;
     card.querySelector('[data-home-chat-count]').textContent=String(count);
     card.querySelector('[data-home-chat-preview]').textContent='Meddelanden från ledarstaben';
     card.querySelector('.home-card-linkhint').textContent='Öppna meddelandet →';
     card.setAttribute('aria-label',title+'. Öppna meddelandet');
     const open=()=>root.KronangPlayerChat.open({playerId:id,playerName:p.full_name||'Meddelanden'});
     card.onclick=open;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
    }
   }
  }else if(perms?.canUsePlayerChatAsLeader(p.role)){
   const s=await root.KronangPlayerChatData.getUnreadSummary();if(version!==refreshVersion)return;
   clearUnread();const card=homeCard(),badge=teamBadge();showCount(badge,s.total);
   if(card){card.hidden=s.total===0;if(s.total){
    card.querySelector('[data-home-chat-count]').textContent=String(s.total);
    card.querySelector('[data-home-chat-title]').textContent=s.players.length+' spelare har skrivit';
    const shown=s.players.slice(0,2).map(p=>p.name+' · '+p.count+' '+(p.count===1?'nytt':'nya'));
    if(s.players.length>2)shown.push('+ '+(s.players.length-2)+' spelare till');
    card.querySelector('[data-home-chat-preview]').textContent=shown.join('  •  ');
    card.querySelector('.home-card-linkhint').textContent='Visa meddelanden →';
    card.setAttribute('aria-label',s.total+' olästa meddelanden från spelarna. Visa meddelanden');
    card.onclick=openInbox;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openInbox();}};
   }}
  }else clearUnread();
 }catch(e){if(version===refreshVersion)clearUnread();console.error('Kunde inte uppdatera meddelandeöversikten:',e);}
}
root.addEventListener('kronang:player-chat-read',refresh);
root.addEventListener('kronang:player-chat-sent',refresh);
root.addEventListener('kronang:development-updated',refresh);
root.addEventListener('focus',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
document.addEventListener('kronang:auth-signed-in',refresh);
document.addEventListener('kronang:auth-signed-out',()=>{refreshVersion++;clearUnread();document.getElementById('playerChatInboxOverlay')?.remove();});
setTimeout(refresh,1700);
root.KronangPlayerChatInbox={refresh,openInbox,openPlayer};
})(window);