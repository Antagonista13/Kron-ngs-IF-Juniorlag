(function(root){
 'use strict';let profile=null,status=null,busy=false,refreshVersion=0;const device=root.KronangPushSubscriptions;const routing=root.KifPushRouting,base=new URL('./',root.location.href).href;let pending=routing.parse(root.location.href,base),routingBusy=false;const pendingKey='kif-push-destination';
 try{if(pending)sessionStorage.setItem(pendingKey,JSON.stringify(pending));else{const saved=JSON.parse(sessionStorage.getItem(pendingKey)||'null');if(routing.valid(saved))pending=saved;}}catch{}
 function eligible(p){return !!p?.is_active&&['player','admin','coach'].includes(p.role);}
 function card(){let el=document.getElementById('pushNotificationsCard');if(!el){el=document.createElement('section');el.id='pushNotificationsCard';el.className='card push-notifications';el.hidden=true;el.innerHTML='<h3>Notiser</h3><p id="pushState" aria-live="polite"></p><button id="pushActivate" type="button">Aktivera notiser</button><fieldset id="pushChoices"><legend>Jag vill få notiser om</legend><label><input id="pushPosts" type="checkbox"> Laginlägg</label><label><input id="pushMessages" type="checkbox"> Meddelanden</label></fieldset><button id="pushTest" type="button">Testa notis</button><button id="pushDisable" type="button">Stäng av</button>';const page=document.getElementById('profilePage');if(!page)return null;page.insertBefore(el,page.querySelector('.logout-card'));el.addEventListener('click',click);el.addEventListener('change',saveChoices);}return el;}
 function message(text){const el=document.getElementById('pushState');if(el)el.textContent=text;}
 function lock(value){busy=value;const el=card();el?.querySelectorAll('button,input').forEach(x=>x.disabled=value);if(!value&&status){document.getElementById('pushActivate').disabled=!device.support().supported||!status.public_key;document.getElementById('pushTest').disabled=!status.delivery_enabled;}}
 async function rpc(name,args){const {data,error}=await root.kronangSupabase.rpc(name,args);if(error)throw error;return data;}
 async function badge(count){if(!Number.isSafeInteger(count)||count<0)return;try{if(count)await navigator.setAppBadge?.(count);else await navigator.clearAppBadge?.();}catch{}}
 async function refresh(){
 const version=++refreshVersion,el=card();if(!el||!root.kronangSupabase)return;
 try{
 const {data:{user}}=await root.kronangSupabase.auth.getUser();
 if(!user){profile=null;status=null;el.hidden=true;await device.reconcile(null);await device.clearBadge();return;}
 const {data:p,error}=await root.kronangSupabase.from('profiles').select('id,role,is_active,team,full_name').eq('id',user.id).single();if(error)throw error;
 if(version!==refreshVersion)return;
 profile=p;el.hidden=!eligible(p);document.getElementById('pushPosts').closest('label').hidden=p.role!=='player';await device.reconcile(user.id);if(el.hidden){await device.clearBadge();return;}
 status=await rpc('get_push_status');if(version!==refreshVersion)return;
 device.configure({ownerId:user.id,publicKey:status.public_key,preferences:status.posts_enabled||status.messages_enabled?{posts:p.role==='player'&&status.posts_enabled,messages:status.messages_enabled}:{posts:p.role==='player',messages:true}});
 const sub=await device.localSubscription();let own=null;
 if(sub){const {data,error}=await root.kronangSupabase.from('push_subscriptions').select('id,enabled').eq('endpoint',sub.endpoint).eq('profile_id',user.id).maybeSingle();if(error)throw error;own=data?.enabled?data:null;}
 el.dataset.subscriptionId=own?.id||'';
 const support=device.support();message(!support.supported?support.reason:root.Notification.permission==='denied'?'Notiser är blockerade. Tillåt KIF-notiser i telefonens inställningar.':own?(status.delivery_enabled?'Notiser är aktiverade på den här enheten.':'Enheten är ansluten. Utskick väntar på att laget aktiverar funktionen.'):'Aktivera notiser på den här enheten.');
 document.getElementById('pushActivate').hidden=!!own;document.getElementById('pushActivate').disabled=busy||!support.supported||!status.public_key;
 document.getElementById('pushPosts').checked=status.posts_enabled;document.getElementById('pushMessages').checked=status.messages_enabled;
 document.getElementById('pushChoices').hidden=!own;document.getElementById('pushTest').hidden=!own;document.getElementById('pushTest').disabled=busy||!status.delivery_enabled;
 document.getElementById('pushDisable').hidden=!own;await badge(status.unread_count);
 await routePending();
 }catch{if(version===refreshVersion){message('Kunde inte hämta notisinställningar. Öppna Profil för att försöka igen.');const button=document.getElementById('pushActivate');if(button)button.disabled=true;}}
 }
 function click(event){const id=event.target.id;if(busy)return;
 if(id==='pushActivate'){
 // Call before async UI work, preserving permission user activation.
 const activation=device.activate();lock(true);
 activation.then(()=>refresh()).catch(async error=>{await refresh();message(error.message||'Kunde inte aktivera notiser. Tryck Aktivera notiser igen.');}).finally(()=>lock(false));
 }else if(id==='pushDisable'){lock(true);device.disable().then(()=>refresh()).catch(()=>message('Kunde inte stänga av notiser. Försök igen innan du loggar ut.')).finally(()=>lock(false));}
 else if(id==='pushTest'){lock(true);root.kronangSupabase.functions.invoke('kif-push/test',{body:{subscription_id:card().dataset.subscriptionId}}).then(({error})=>{if(error)throw error;message('Testnotisen är skickad. Kontrollera telefonens notiser.');}).catch(()=>message('Testnotisen kunde inte skickas. Försök igen senare.')).finally(()=>lock(false));}
 }
 async function saveChoices(event){if(!['pushPosts','pushMessages'].includes(event.target.id)||busy)return;lock(true);try{await rpc('set_push_preferences',{posts:profile?.role==='player'&&document.getElementById('pushPosts').checked,messages:document.getElementById('pushMessages').checked});await refresh();}catch{await refresh();message('Kunde inte spara valet. Försök igen.');}finally{lock(false);}}
 // Filled by routing integration; profile still works without a pending push.
 function routeMessage(text){let el=document.getElementById('pushRouteMessage');if(!el){el=document.createElement('p');el.id='pushRouteMessage';el.className='push-route-message';el.setAttribute('role','status');document.body.appendChild(el);}el.textContent=text;setTimeout(()=>el.remove(),6000);}
 function clearPending(){pending=null;try{sessionStorage.removeItem(pendingKey);}catch{}const u=new URL(root.location.href);u.searchParams.delete('push_kind');u.searchParams.delete('push_source');root.history.replaceState(null,'',u.href);}
 async function markPostRead(id){if(profile?.role!=='player')return;try{const count=await rpc('mark_push_post_read',{post_id:id});await badge(count);document.dispatchEvent(new CustomEvent('kronang:push-read'));}catch{}}
 async function routePending(){
 if(!pending||routingBusy||!eligible(profile))return;
 const target=pending;const owner=profile.id;routingBusy=true;
 try{
 if(target.kind==='test'){document.querySelector('.nav-item[data-page="profilePage"]')?.click();clearPending();return;}
 if(target.kind==='post'){
 if(profile.role!=='player')throw new Error('Den här notisen är inte tillgänglig för dig.');
 const {data,error}=await root.kronangSupabase.from('team_posts').select('id,team').eq('id',target.source_id).maybeSingle();
 if(error||!data||data.team!==profile.team)throw new Error('Inlägget finns inte längre eller är inte tillgängligt för dig.');
 await root.loadTeamPosts(profile);if(profile?.id!==owner)return;
 if(!await root.openHomeNewsPost({dataset:{postId:target.source_id}}))throw new Error('Inlägget kunde inte öppnas. Öppna Laget och försök igen.');
 }else{
 const {data:m,error}=await root.kronangSupabase.from('player_chat_messages').select('conversation_id').eq('id',target.source_id).maybeSingle();if(error||!m)throw new Error('Meddelandet finns inte längre eller är inte tillgängligt för dig.');
 const {data:c,error:ce}=await root.kronangSupabase.from('player_chat_conversations').select('player_id').eq('id',m.conversation_id).maybeSingle();if(ce||!c||profile?.id!==owner)throw new Error('Meddelandet är inte tillgängligt för dig.');
 let playerName=profile.full_name||'Min chatt';
 if(profile.role==='player'){
  if(c.player_id!==await root.KronangPlayerChatData.ownPlayerId())throw new Error('Meddelandet är inte tillgängligt för dig.');
 }else{
  const {data:player,error:pe}=await root.kronangSupabase.from('players').select('id,full_name').eq('id',c.player_id).maybeSingle();
  if(pe||!player)throw new Error('Meddelandet är inte tillgängligt för dig.');playerName=player.full_name||'Spelare';
 }
 if(profile?.id!==owner)return;
 await root.KronangPlayerChat.open({playerId:c.player_id,playerName});
 }
 clearPending();
 }catch(error){routeMessage(error.message||'Notisen kunde inte öppnas.');clearPending();}finally{routingBusy=false;}
 }
 root.KronangPushNotifications={refresh,badge,markPostRead,routePending};
 if(navigator.serviceWorker)navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).catch(()=>{});
 document.addEventListener('kronang:auth-signed-in',refresh);
 document.addEventListener('kronang:auth-signed-out',()=>{refreshVersion++;profile=null;status=null;device.configure({});device.reconcile(null).catch(()=>{});device.clearBadge();const el=card();if(el)el.hidden=true;});
 document.addEventListener('kronang:push-read',refresh);
 document.addEventListener('click',e=>{if(e.target.closest('.nav-item[data-page="profilePage"]'))refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 root.addEventListener('focus',refresh);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
})(window);
