(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports={...api,create:factory};else root.KronangPushSubscriptions=api;})(typeof window==='object'?window:globalThis,function(root){
 'use strict';
 const OWNER='kif-push-device-owner';let context={},epoch=0;
 function stored(){try{return root.localStorage.getItem(OWNER);}catch{return null;}}
 function remember(value){try{if(value)root.localStorage.setItem(OWNER,value);else root.localStorage.removeItem(OWNER);}catch{}}
 function support(){const nav=root.navigator||{},ios=/iPad|iPhone|iPod/.test(nav.userAgent||'')||(/Macintosh/.test(nav.userAgent||'')&&nav.maxTouchPoints>1),installed=!!nav.standalone||!!root.matchMedia?.('(display-mode: standalone)').matches;
 if(ios&&!installed)return {supported:false,installed,reason:'Öppna KIF i Safari, välj Dela → Lägg till på hemskärmen och öppna sedan appikonen.'};
 const supported=!!(root.isSecureContext&&nav.serviceWorker&&root.PushManager&&root.Notification);
 return {supported,installed,reason:supported?'':'Den här webbläsaren stöder inte notiser. På iPhone behövs iOS 16.4 eller senare och appen på hemskärmen.'};}
 function configure(value){if(context.ownerId!==value.ownerId)epoch++;context=value;}
 async function clearBadge(){try{await root.navigator?.clearAppBadge?.();}catch{}}
 async function registration(){if(!root.navigator?.serviceWorker)return null;await root.navigator.serviceWorker.register('./service-worker.js',{scope:'./'});return root.navigator.serviceWorker.ready;}
 async function rpc(name,args){const {data,error}=await root.kronangSupabase.rpc(name,args);if(error)throw error;return data;}
 async function existingRegistration(){return root.navigator?.serviceWorker?.getRegistration?.('./')||null;}
 async function reconcile(ownerId){const old=stored();if(old&&old!==ownerId){epoch++;const reg=await existingRegistration();const sub=await reg?.pushManager?.getSubscription?.();if(sub)await sub.unsubscribe();remember(null);await clearBadge();}return ownerId;}
 async function localSubscription(){if(!context.ownerId||stored()!==context.ownerId)return null;const reg=await existingRegistration();return reg?.pushManager?.getSubscription?.();}
 async function activate(){
 const s=support();if(!s.supported)throw new Error(s.reason);
 if(root.Notification.permission==='denied')throw new Error('Notiser är blockerade. Tillåt KIF-notiser i telefonens inställningar och försök igen.');
 if(!context.ownerId||!context.publicKey)throw new Error('Notiser är inte klara ännu. Försök igen senare.');
 // Must run in the click's synchronous stack, before any await.
 const permission=root.Notification.permission==='granted'?Promise.resolve('granted'):root.Notification.requestPermission();
 const owner=context.ownerId,key=context.publicKey,version=epoch;let sub;
 try{
 if(await permission!=='granted')throw new Error('Tillåt notiser för KIF i telefonens inställningar och försök igen.');
 const {data,error}=await root.kronangSupabase.auth.getUser();if(error||data.user?.id!==owner||version!==epoch)throw new Error('Kontot ändrades. Öppna Profil och försök igen.');
 await reconcile(owner);
 const reg=await registration();sub=await reg.pushManager.getSubscription();
 // An unowned subscription cannot silently become this account's device.
 if(sub&&stored()!==owner){await sub.unsubscribe();sub=null;}
 if(!sub){const bytes=root.atob(key.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(key.length/4)*4,'='));sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(bytes,c=>c.charCodeAt(0))});}
 const check=await root.kronangSupabase.auth.getUser();if(check.error||check.data.user?.id!==owner||context.ownerId!==owner)throw new Error('Kontot ändrades. Försök igen.');
 const json=sub.toJSON();const id=await rpc('register_push_subscription',{endpoint:json.endpoint,p256dh:json.keys.p256dh,auth:json.keys.auth});
 const prefs=context.preferences||{posts:true,messages:true};await rpc('set_push_preferences',prefs);
 if(context.ownerId!==owner)throw new Error('Kontot ändrades. Försök igen.');
 remember(owner);return {id,subscription:sub};
 }catch(error){if(sub)await sub.unsubscribe().catch(()=>{});remember(null);throw error;}
 }
 async function disable(){const reg=await existingRegistration(),sub=await reg?.pushManager?.getSubscription?.();if(sub){await rpc('disable_push_subscription',{endpoint:sub.endpoint});await sub.unsubscribe();}remember(null);await clearBadge();}
 return {support,configure,reconcile,activate,disable,detachBeforeLogout:disable,localSubscription,clearBadge};
});
