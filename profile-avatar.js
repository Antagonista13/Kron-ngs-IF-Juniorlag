function buildProfileAvatarModel(profile){
  const item=profile||{};
  return {name:item.full_name||'Spelare',avatarUrl:item.avatar_url||''};
}

function profileFallbackIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/></svg>';
}

function renderProfileAvatar(model){
  const avatar=document.querySelector('#profilePage .profile-avatar');
  if(!avatar)return;
  avatar.innerHTML='';
  avatar.setAttribute('aria-label','Profilbild för '+model.name);
  if(model.avatarUrl){const img=document.createElement('img');img.src=model.avatarUrl;img.alt='Profilbild för '+model.name;avatar.appendChild(img);}else{avatar.innerHTML=profileFallbackIcon();}
}

async function loadProfileAvatar(){
  if(!window.kronangSupabase)return;
  const {data:sessionData}=await window.kronangSupabase.auth.getSession();
  const user=sessionData.session?sessionData.session.user:null;if(!user)return;
  const {data}=await window.kronangSupabase.from('profiles').select('full_name, avatar_url').eq('id',user.id).maybeSingle();
  if(data)renderProfileAvatar(buildProfileAvatarModel(data));
}

function waitForProfileAvatar(){if(window.kronangSupabase){loadProfileAvatar();return;}setTimeout(waitForProfileAvatar,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={buildProfileAvatarModel,profileFallbackIcon};
if(typeof window!=='undefined'&&typeof document!=='undefined')waitForProfileAvatar();
