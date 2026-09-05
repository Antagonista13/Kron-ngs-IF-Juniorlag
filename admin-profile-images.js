(function(root){
function roleLabel(role){return{admin:'Admin',coach:'Ledare',player:'Spelare',parent:'Förälder',pending:'Väntar'}[role]||'Användare';}
function ensureSection(){
  const page=document.getElementById('adminPage');if(!page)return null;
  let section=document.getElementById('adminProfileImagesSection');if(section)return section;
  section=document.createElement('section');section.id='adminProfileImagesSection';section.className='admin-section admin-profile-images-section';section.innerHTML='<span class="admin-kicker">PROFILBILDER</span><h3>Profilbilder</h3><p>Välj eller byt profilbild för spelare, föräldrar och ledare.</p><div class="admin-profile-images-list"></div>';
  const invite=document.getElementById('adminInviteCard');if(invite)page.insertBefore(section,invite);else page.appendChild(section);return section;
}
async function load(){
  if(!root.kronangSupabase||!root.KronangProfileAvatar)return;
  const {data:sessionData}=await root.kronangSupabase.auth.getSession();const user=sessionData.session&&sessionData.session.user;if(!user)return;
  const {data:me}=await root.kronangSupabase.from('profiles').select('role,is_active').eq('id',user.id).maybeSingle();if(!me||me.role!=='admin'||me.is_active===false)return;
  const section=ensureSection();if(!section)return;const host=section.querySelector('.admin-profile-images-list');host.innerHTML='<p class="admin-empty">Hämtar profilbilder…</p>';
  const usersResult=await root.kronangSupabase.rpc('admin_list_users');if(usersResult.error){host.innerHTML='<p class="admin-empty">Profilbilder kunde inte hämtas.</p>';return;}
  const rows=(usersResult.data||[]).filter(row=>row.is_active!==false&&row.role!=='pending'),ids=rows.map(r=>r.profile_id).filter(Boolean);let avatarRows=[];
  if(ids.length){const result=await root.kronangSupabase.from('profiles').select('id,avatar_url').in('id',ids);avatarRows=result.data||[];}
  const pathById=new Map(avatarRows.map(r=>[r.id,r.avatar_url||'']));host.innerHTML='';
  for(const row of rows){const path=pathById.get(row.profile_id)||'',url=await root.KronangProfileAvatar.resolveProfileImageUrl(path);const card=document.createElement('article');card.className='admin-profile-image-card';const avatar=document.createElement('div');avatar.className='admin-profile-image-avatar';if(url){const img=document.createElement('img');img.src=url;img.alt='Profilbild för '+(row.full_name||'användare');avatar.appendChild(img);}else{avatar.innerHTML=root.KronangProfileAvatar.profileFallbackIcon();}const copy=document.createElement('div');copy.className='admin-profile-image-copy';const name=document.createElement('strong');name.textContent=row.full_name||'Namnlös användare';const role=document.createElement('span');role.textContent=roleLabel(row.role);copy.append(name,role);const button=document.createElement('button');button.type='button';button.textContent=path?'ÄNDRA BILD':'VÄLJ BILD';button.addEventListener('click',()=>root.KronangProfileAvatar.openAdminProfileImagePicker({targetType:'profile',targetId:row.profile_id,name:row.full_name,currentPath:path,onSaved:load}));card.append(avatar,copy,button);host.appendChild(card);}
  if(!rows.length)host.innerHTML='<p class="admin-empty">Inga användare att visa.</p>';
}
function loadAccountLinkingUx(){if(root.KronangAdminAccountLinking||document.querySelector('script[data-admin-account-linking]'))return;const script=document.createElement('script');script.src='admin-account-linking.js?v=1';script.dataset.adminAccountLinking='true';document.head.appendChild(script);}
if(typeof document!=='undefined'){loadAccountLinkingUx();document.addEventListener('click',event=>{if(event.target&&event.target.closest&&event.target.closest('#openAdminPage'))setTimeout(load,50);});document.addEventListener('kronang:auth-signed-in',()=>setTimeout(load,150));setTimeout(load,1200);}
root.KronangAdminProfileImages={load};
})(typeof window!=='undefined'?window:{});
