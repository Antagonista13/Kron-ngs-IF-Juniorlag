function buildProfileAvatarModel(profile){
  const item=profile||{};
  return {name:item.full_name||'Spelare',avatarUrl:item.avatar_url||''};
}

function mergeProfileAvatarFields(base, avatarRow){
  const result=Object.assign({},base||{});
  result.avatar_url=avatarRow&&avatarRow.avatar_url?avatarRow.avatar_url:'';
  return result;
}

function profileFallbackIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/></svg>';
}

function buildProfileImageObjectPath(targetType,targetId){
  const folder={profile:'profiles',staff:'staff',player:'players'}[targetType];
  if(!folder||targetId===null||targetId===undefined||targetId==='')return'';
  return folder+'/'+String(targetId)+'/avatar.jpg';
}

function isAbsoluteImageUrl(value){return /^(https?:|data:|blob:)/i.test(String(value||''));}

async function resolveProfileImageUrl(value){
  const path=String(value||'').trim();
  if(!path||isAbsoluteImageUrl(path))return path;
  if(typeof window==='undefined'||!window.kronangSupabase)return path;
  const {data,error}=await window.kronangSupabase.storage.from('profile-images').createSignedUrl(path,3600);
  if(error||!data)return'';
  return data.signedUrl||data.signedURL||'';
}

function renderProfileAvatar(model){
  const avatar=document.querySelector('#profilePage .profile-avatar');
  if(!avatar)return;
  avatar.innerHTML='';
  avatar.setAttribute('aria-label','Profilbild för '+model.name);
  if(model.avatarUrl){const img=document.createElement('img');img.src=model.avatarUrl;img.alt='Profilbild för '+model.name;avatar.appendChild(img);}else{avatar.innerHTML=profileFallbackIcon();}
}

function drawSquareCrop(canvas,image,zoomValue,xValue,yValue){
  if(!canvas||!image)return;
  const ctx=canvas.getContext('2d'),size=canvas.width;
  const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
  if(!iw||!ih)return;
  const base=Math.max(size/iw,size/ih),zoom=Math.max(1,Number(zoomValue)||1),scale=base*zoom,w=iw*scale,h=ih*scale;
  const extraX=Math.max(0,w-size),extraY=Math.max(0,h-size);
  const x=(size-w)/2+(Number(xValue)||0)/100*(extraX/2);
  const y=(size-h)/2+(Number(yValue)||0)/100*(extraY/2);
  ctx.clearRect(0,0,size,size);ctx.drawImage(image,x,y,w,h);
}

function canvasToJpegBlob(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Kunde inte skapa bild.')),'image/jpeg',0.9));
}

function loadLocalImage(file){
  return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Bilden kunde inte läsas.'));};img.src=url;});
}

async function assignProfileImage(targetType,targetId,objectPath){
  const rpc={profile:'admin_assign_profile_image',staff:'admin_assign_staff_image',player:'admin_assign_player_image'}[targetType];
  const key={profile:'p_profile_id',staff:'p_staff_id',player:'p_player_id'}[targetType];
  if(!rpc||!key)throw new Error('Ogiltig bildmottagare.');
  const args={p_object_path:objectPath||''};args[key]=targetId;
  const {error}=await window.kronangSupabase.rpc(rpc,args);if(error)throw error;
}

function openAdminProfileImagePicker(options){
  const opts=options||{},targetType=opts.targetType,targetId=opts.targetId;
  if(typeof document==='undefined'||typeof window==='undefined'||!window.kronangSupabase)return;
  const objectPath=buildProfileImageObjectPath(targetType,targetId);if(!objectPath)return;
  document.querySelectorAll('.profile-image-modal').forEach(el=>el.remove());
  const modal=document.createElement('div');modal.className='profile-image-modal';
  modal.innerHTML='<div class="profile-image-dialog" role="dialog" aria-modal="true"><div class="profile-image-dialog-head"><div><span>PROFILBILD</span><h3>Justera bilden</h3></div><button type="button" data-close aria-label="Stäng">×</button></div><p>Välj en färdig bild från mobilen. Placera personen i den runda förhandsvisningen.</p><input class="profile-image-file" type="file" accept="image/*"><div class="profile-image-crop"><canvas width="640" height="640"></canvas></div><label>Zoom<input class="profile-image-zoom" type="range" min="1" max="3" step="0.01" value="1"></label><label>Flytta i sidled<input class="profile-image-x" type="range" min="-100" max="100" step="1" value="0"></label><label>Flytta upp / ner<input class="profile-image-y" type="range" min="-100" max="100" step="1" value="0"></label><p class="profile-image-message" aria-live="polite"></p><div class="profile-image-actions"><button type="button" data-save disabled>SPARA BILD</button><button type="button" class="secondary" data-remove>TA BORT BILD</button></div></div>';
  document.body.appendChild(modal);
  const fileInput=modal.querySelector('.profile-image-file'),canvas=modal.querySelector('canvas'),zoom=modal.querySelector('.profile-image-zoom'),x=modal.querySelector('.profile-image-x'),y=modal.querySelector('.profile-image-y'),save=modal.querySelector('[data-save]'),remove=modal.querySelector('[data-remove]'),message=modal.querySelector('.profile-image-message');
  remove.hidden=!opts.currentPath;let image=null;
  const redraw=()=>{if(image)drawSquareCrop(canvas,image,zoom.value,x.value,y.value);};
  [zoom,x,y].forEach(input=>input.addEventListener('input',redraw));
  fileInput.addEventListener('change',async()=>{message.textContent='';const file=fileInput.files&&fileInput.files[0];if(!file)return;if(!String(file.type||'').startsWith('image/')){message.textContent='Välj en bildfil.';return;}if(file.size>8388608){message.textContent='Bilden får vara högst 8 MB.';return;}try{image=await loadLocalImage(file);zoom.value='1';x.value='0';y.value='0';redraw();save.disabled=false;}catch(err){message.textContent=err.message||'Bilden kunde inte läsas.';}});
  save.addEventListener('click',async()=>{if(!image)return;save.disabled=true;save.textContent='SPARAR…';message.textContent='';try{const blob=await canvasToJpegBlob(canvas);const {error}=await window.kronangSupabase.storage.from('profile-images').upload(objectPath,blob,{upsert:true,contentType:'image/jpeg',cacheControl:'3600'});if(error)throw error;await assignProfileImage(targetType,targetId,objectPath);if(opts.onSaved)await opts.onSaved(objectPath);modal.remove();}catch(err){console.error('Profilbild:',err);message.textContent='Det gick inte att spara bilden. Försök igen.';save.disabled=false;save.textContent='SPARA BILD';}});
  remove.addEventListener('click',async()=>{if(!confirm('Ta bort profilbilden?'))return;remove.disabled=true;message.textContent='';try{const current=String(opts.currentPath||'');if(current&&!isAbsoluteImageUrl(current))await window.kronangSupabase.storage.from('profile-images').remove([current]);await assignProfileImage(targetType,targetId,'');if(opts.onSaved)await opts.onSaved('');modal.remove();}catch(err){console.error('Ta bort profilbild:',err);message.textContent='Det gick inte att ta bort bilden.';remove.disabled=false;}});
  modal.querySelector('[data-close]').addEventListener('click',()=>modal.remove());modal.addEventListener('click',event=>{if(event.target===modal)modal.remove();});
}

async function loadProfileAvatar(){
  if(!window.kronangSupabase)return;
  const {data:sessionData}=await window.kronangSupabase.auth.getSession();
  const user=sessionData.session?sessionData.session.user:null;if(!user)return;
  const baseResult=await window.kronangSupabase.from('profiles').select('full_name,avatar_url').eq('id',user.id).maybeSingle();
  if(!baseResult.data)return;
  const display=Object.assign({},baseResult.data,{avatar_url:await resolveProfileImageUrl(baseResult.data.avatar_url)});
  renderProfileAvatar(buildProfileAvatarModel(display));
}

function waitForProfileAvatar(){if(window.kronangSupabase){loadProfileAvatar();return;}setTimeout(waitForProfileAvatar,100);}
const profileAvatarApi={buildProfileAvatarModel,mergeProfileAvatarFields,profileFallbackIcon,buildProfileImageObjectPath,resolveProfileImageUrl,drawSquareCrop,openAdminProfileImagePicker};
if(typeof module!=='undefined'&&module.exports)module.exports=profileAvatarApi;
if(typeof window!=='undefined'){window.KronangProfileAvatar=profileAvatarApi;if(typeof document!=='undefined')waitForProfileAvatar();}
