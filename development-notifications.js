(function(root){
let unread=[];
function hasUnreadDevelopmentNotifications(rows){return(rows||[]).some(x=>!x.read_at);}
function notificationMatchesEntity(row,type,id){return Boolean(row&&row.entity_type===type&&String(row.entity_id)===String(id));}
async function loadUnread(){if(!root||!root.kronangSupabase)return[];const{data,error}=await root.kronangSupabase.from('development_notifications').select('id,event_type,entity_type,entity_id,created_at,read_at').is('read_at',null).order('created_at',{ascending:false});if(error){return[];}return data||[];}
function renderDot(rows){if(typeof document==='undefined')return;document.querySelectorAll('.development-unread-dot').forEach(el=>{el.hidden=!hasUnreadDevelopmentNotifications(rows);});}
function decorate(rows){if(typeof document==='undefined')return;document.querySelectorAll('[data-entity-type][data-entity-id]').forEach(el=>{const n=(rows||[]).find(x=>notificationMatchesEntity(x,el.dataset.entityType,el.dataset.entityId));let badge=el.querySelector('.development-new');if(n&&!badge){badge=document.createElement('span');badge.className='development-new';badge.textContent='NYTT';(el.querySelector('strong')||el).appendChild(badge);}if(!n&&badge)badge.remove();});}
async function refresh(){unread=await loadUnread();renderDot(unread);decorate(unread);return unread;}
async function markNotificationRead(id){if(!root||!root.kronangSupabase||!id)return;const{error}=await root.kronangSupabase.rpc('mark_development_notification_read',{p_notification_id:id});if(error)throw error;await refresh();}
async function markRelatedNotificationRead(type,id){const n=unread.find(x=>notificationMatchesEntity(x,type,id));if(n)await markNotificationRead(n.id);}
function bindConcreteRead(){if(typeof document==='undefined')return;document.addEventListener('click',e=>{const item=e.target.closest('[data-entity-type][data-entity-id]');if(!item||!item.querySelector('.development-new'))return;markRelatedNotificationRead(item.dataset.entityType,item.dataset.entityId).catch(err=>console.error('Kunde inte markera utvecklingsnotis som läst:',err));});}
const notificationsApi={hasUnreadDevelopmentNotifications,notificationMatchesEntity,loadUnread,renderDot,refresh,markNotificationRead,markRelatedNotificationRead};if(typeof module!=='undefined'&&module.exports)module.exports=notificationsApi;if(root){root.KronangDevelopmentNotifications=notificationsApi;bindConcreteRead();root.addEventListener('kronang:development-updated',refresh);setTimeout(refresh,1000);}
})(typeof window!=='undefined'?window:null);
