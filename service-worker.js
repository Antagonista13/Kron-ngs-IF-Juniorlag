'use strict';
importScripts('./push-routing.js');
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// No fetch interception or caches: authenticated data stays in the online application.
self.addEventListener('push',event=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 event.waitUntil((async()=>{
 const title=data.kind==='test'?'Testnotis från KIF':data.kind==='post'?'Nytt laginlägg i KIF':'Nytt meddelande i KIF';
 await self.registration.showNotification(title,{body:data.kind==='test'?'Notiser fungerar på den här enheten.':'Öppna KIF för att läsa.',icon:'./icons/kif-192.png',badge:'./icons/kif-192.png',tag:'kif-'+(typeof data.id==='string'?data.id:'notification'),data:{kind:data.kind,source_id:data.source_id},renotify:false});
 if(Number.isSafeInteger(data.unread_count)&&data.unread_count>=0)try{if(data.unread_count)await navigator.setAppBadge?.(data.unread_count);else await navigator.clearAppBadge?.();}catch{}
 })());
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const url=KifPushRouting.build(event.notification.data,self.registration.scope);
 event.waitUntil((async()=>{
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 const base=new URL(self.registration.scope);
 const app=clients.find(client=>{try{const u=new URL(client.url);return u.origin===base.origin&&(u.pathname===base.pathname||u.pathname===base.pathname+'index.html');}catch{return false;}});
 if(app){const navigated=await app.navigate(url);if(navigated)await navigated.focus();else await self.clients.openWindow(url);}else await self.clients.openWindow(url);
 })());
});
