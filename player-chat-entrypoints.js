(function(root){
async function profile(){const c=root.kronangSupabase;if(!c)return null;const{data:u}=await c.auth.getUser();if(!u.user)return null;const{data}=await c.from('profiles').select('id,full_name,role,is_active').eq('id',u.user.id).maybeSingle();return data;}
function makeButton(playerId,name){const b=document.createElement('button');b.type='button';b.className='player-chat-entry';b.dataset.playerChatId=playerId;b.innerHTML='<span>MEDDELANDEN</span><span data-player-chat-badge></span>';b.addEventListener('click',()=>root.KronangPlayerChat.open({playerId,playerName:name}));return b;}
async function ensureOwn(){
 const page=document.getElementById('developmentPage');
 if(page)page.querySelectorAll('[data-player-chat-own]').forEach(el=>el.remove());
 const p=await profile(),perms=root.KronangPermissions;
 if(!p||!p.is_active||!perms?.canUseOwnPlayerChat(p.role))return;
}
async function ensureLeaderProfile(){const p=await profile(),perms=root.KronangPermissions;if(!p||!p.is_active||!perms?.canUsePlayerChatAsLeader(p.role))return;const card=document.querySelector('.player-public-profile[data-player-id]');if(!card||card.querySelector('.player-chat-entry'))return;const button=makeButton(card.dataset.playerId,card.dataset.playerName||card.querySelector('h2')?.textContent||'Spelare');const about=card.querySelector('.player-public-profile-about');if(about)card.insertBefore(button,about);else card.append(button);}
function refresh(){ensureOwn().catch(console.error);ensureLeaderProfile().catch(console.error);}
document.addEventListener('kronang:player-profile-ready',refresh);document.addEventListener('click',()=>setTimeout(refresh,60),true);setTimeout(refresh,1200);
if(root)root.KronangPlayerChatEntrypoints={refresh,ensureOwn,ensureLeaderProfile};
})(typeof window!=='undefined'?window:null);
