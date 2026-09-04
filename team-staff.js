function buildTeamStaffMember(row){
  const item=row||{};
  const phone=(item.phone||'').trim();
  const email=(item.email||'').trim();
  return {
    id:item.id==null?null:item.id,
    name:(item.display_name||'').trim(),
    role:(item.staff_role||'').trim(),
    description:(item.description||'').trim(),
    sortOrder:Number.isFinite(Number(item.sort_order))?Number(item.sort_order):100,
    phone:phone,
    email:email,
    avatarUrl:(item.avatar_url||'').trim(),
    avatarPath:(item.avatar_path||item.avatar_url||'').trim(),
    phoneHref:phone?'tel:'+phone.replace(/\s+/g,''):'',
    emailHref:email?'mailto:'+email:''
  };
}

function buildStaffSaveRequest(member){
  const item=member||{};
  const id=item.id==null||item.id===''?null:Number(item.id);
  const sortOrder=Number.isFinite(Number(item.sortOrder))?Number(item.sortOrder):100;
  return {
    p_id:id,
    p_display_name:(item.name||'').trim(),
    p_staff_role:(item.role||'').trim(),
    p_description:(item.description||'').trim(),
    p_phone:(item.phone||'').trim(),
    p_email:(item.email||'').trim(),
    p_avatar_url:(item.avatarPath||item.avatarUrl||'').trim(),
    p_sort_order:sortOrder
  };
}

function buildStaffFallbackIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/></svg>';
}

function canAdminManageStaff(role){
  return Boolean(window.KronangPermissions&&window.KronangPermissions.canManageStaff?window.KronangPermissions.canManageStaff(role):role==='admin');
}

function createStaffEditor(member,onSaved,onCancel){
  const item=member||{id:null,name:'',role:'',description:'',phone:'',email:'',avatarPath:'',sortOrder:100};
  const form=document.createElement('form');form.className='team-staff-editor';
  form.innerHTML='<label>Namn<input name="name" required maxlength="120"></label><label>Roll / uppgift<input name="role" required maxlength="120" placeholder="Exempel: Kioskansvarig"></label><label>Kort beskrivning<textarea name="description" rows="3" maxlength="500" placeholder="Vad ansvarar personen för?"></textarea></label><div class="team-staff-editor-grid"><label>Telefon<input name="phone" inputmode="tel"></label><label>E-post<input name="email" type="email" inputmode="email"></label></div><div class="team-staff-editor-actions"><button type="submit">SPARA</button><button type="button" class="secondary" data-cancel>AVBRYT</button></div><p class="team-staff-editor-message" aria-live="polite"></p>';
  form.elements.name.value=item.name||'';form.elements.role.value=item.role||'';form.elements.description.value=item.description||'';form.elements.phone.value=item.phone||'';form.elements.email.value=item.email||'';
  form.querySelector('[data-cancel]').addEventListener('click',()=>onCancel&&onCancel());
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();const submit=form.querySelector('[type=submit]'),message=form.querySelector('.team-staff-editor-message');
    const request=buildStaffSaveRequest({id:item.id,name:form.elements.name.value,role:form.elements.role.value,description:form.elements.description.value,phone:form.elements.phone.value,email:form.elements.email.value,avatarPath:item.avatarPath,sortOrder:item.sortOrder});
    if(!request.p_display_name||!request.p_staff_role){message.textContent='Namn och roll måste fyllas i.';return;}
    submit.disabled=true;submit.textContent='SPARAR…';message.textContent='';
    try{const {error}=await window.kronangSupabase.rpc('admin_save_team_staff',request);if(error)throw error;onSaved&&await onSaved();}
    catch(err){console.error('Kunde inte spara ledare:',err);message.textContent='Det gick inte att spara. Försök igen.';submit.disabled=false;submit.textContent='SPARA';}
  });
  return form;
}

function renderStaffRows(rows,isAdmin){
  const page=document.getElementById('teamPage');if(!page)return;
  let section=document.getElementById('teamStaffSection');
  if(!section){section=document.createElement('section');section.id='teamStaffSection';section.className='team-staff-section';page.appendChild(section);}
  section.innerHTML='';
  const heading=document.createElement('div');heading.className='team-staff-heading';heading.innerHTML='<span>LAGET</span><h2>Ledarstaben</h2><p>Snabb kontakt när du behöver få tag i någon.</p>';
  if(isAdmin){const manage=document.createElement('button');manage.type='button';manage.className='team-staff-manage-button';manage.textContent='REDIGERA STAB';heading.appendChild(manage);manage.addEventListener('click',()=>{section.classList.toggle('editing');manage.textContent=section.classList.contains('editing')?'KLAR':'REDIGERA STAB';});}
  section.appendChild(heading);

  if(isAdmin){const add=document.createElement('button');add.type='button';add.className='team-staff-add-button';add.textContent='+ LÄGG TILL PERSON';section.appendChild(add);const editorHost=document.createElement('div');editorHost.className='team-staff-editor-host';section.appendChild(editorHost);add.addEventListener('click',()=>{editorHost.replaceChildren(createStaffEditor(null,loadTeamStaff,()=>editorHost.replaceChildren()));});}

  const list=document.createElement('div');list.className='team-staff-list';section.appendChild(list);
  const members=(rows||[]).map(buildTeamStaffMember).filter(member=>member.name);
  members.forEach((member,index)=>{
    const card=document.createElement('article');card.className='team-staff-card';card.dataset.staffId=member.id;
    const avatar=document.createElement('div');avatar.className='team-staff-avatar';
    if(member.avatarUrl){const img=document.createElement('img');img.src=member.avatarUrl;img.alt='Profilbild för '+member.name;avatar.appendChild(img);}else{avatar.innerHTML=buildStaffFallbackIcon();}
    const copy=document.createElement('div');copy.className='team-staff-copy';const name=document.createElement('strong');name.textContent=member.name;const role=document.createElement('span');role.textContent=member.role||'Ledare';copy.append(name,role);if(member.description){const description=document.createElement('p');description.className='team-staff-description';description.textContent=member.description;copy.appendChild(description);}
    const actions=document.createElement('div');actions.className='team-staff-actions';if(member.phoneHref){const a=document.createElement('a');a.href=member.phoneHref;a.setAttribute('aria-label','Ring '+member.name);a.textContent='Ring';actions.appendChild(a);}if(member.emailHref){const a=document.createElement('a');a.href=member.emailHref;a.setAttribute('aria-label','Mejla '+member.name);a.textContent='Mejl';actions.appendChild(a);}
    card.append(avatar,copy,actions);
    if(isAdmin){const admin=document.createElement('div');admin.className='team-staff-admin-actions';const edit=document.createElement('button');edit.type='button';edit.textContent='Redigera';const image=document.createElement('button');image.type='button';image.textContent='Bild';const up=document.createElement('button');up.type='button';up.textContent='↑';up.disabled=index===0;const down=document.createElement('button');down.type='button';down.textContent='↓';down.disabled=index===members.length-1;const remove=document.createElement('button');remove.type='button';remove.textContent='Ta bort';admin.append(edit,image,up,down,remove);card.appendChild(admin);
      edit.addEventListener('click',()=>{let host=card.querySelector('.team-staff-inline-editor');if(!host){host=document.createElement('div');host.className='team-staff-inline-editor';card.appendChild(host);}host.replaceChildren(createStaffEditor(member,loadTeamStaff,()=>host.remove()));});
      image.addEventListener('click',()=>{if(window.KronangProfileAvatar)window.KronangProfileAvatar.openAdminProfileImagePicker({targetType:'staff',targetId:member.id,name:member.name,currentPath:member.avatarPath,onSaved:loadTeamStaff});});
      async function reorder(targetIndex){const target=members[targetIndex];if(!target)return;const currentOrder=member.sortOrder,targetOrder=target.sortOrder;await Promise.all([window.kronangSupabase.rpc('admin_reorder_team_staff',{p_id:member.id,p_sort_order:targetOrder}),window.kronangSupabase.rpc('admin_reorder_team_staff',{p_id:target.id,p_sort_order:currentOrder})]);await loadTeamStaff();}
      up.addEventListener('click',()=>reorder(index-1));down.addEventListener('click',()=>reorder(index+1));remove.addEventListener('click',async()=>{if(!confirm('Ta bort '+member.name+' från ledarstaben?'))return;const {error}=await window.kronangSupabase.rpc('admin_remove_team_staff',{p_id:member.id});if(error){console.error('Kunde inte ta bort ledare:',error);return;}await loadTeamStaff();});
    }
    list.appendChild(card);
  });
  if(!members.length){const empty=document.createElement('p');empty.className='team-staff-empty';empty.textContent=isAdmin?'Ingen person är tillagd i ledarstaben ännu.':'Kontaktuppgifter till ledarstaben är inte publicerade ännu.';list.appendChild(empty);}
}

async function loadTeamStaff(){
  if(!window.kronangSupabase)return;
  const {data:sessionData}=await window.kronangSupabase.auth.getSession();const user=sessionData.session?sessionData.session.user:null;if(!user)return;
  const {data:profile}=await window.kronangSupabase.from('profiles').select('team,role').eq('id',user.id).maybeSingle();if(!profile||!profile.team)return;
  const {data,error}=await window.kronangSupabase.from('team_staff').select('id, display_name, staff_role, description, phone, email, avatar_url, sort_order').eq('team',profile.team).eq('is_active',true).order('sort_order',{ascending:true}).order('display_name',{ascending:true});
  if(error){console.warn('Ledarstaben kunde inte hämtas ännu:',error.message||error);renderStaffRows([],canAdminManageStaff(profile.role));return;}
  const rows=await Promise.all((data||[]).map(async row=>{const path=row.avatar_url||'';const url=window.KronangProfileAvatar?await window.KronangProfileAvatar.resolveProfileImageUrl(path):path;return Object.assign({},row,{avatar_path:path,avatar_url:url});}));
  renderStaffRows(rows,canAdminManageStaff(profile.role));
}

function waitForTeamStaff(){if(window.kronangSupabase){loadTeamStaff();return;}setTimeout(waitForTeamStaff,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={buildTeamStaffMember,buildStaffSaveRequest};
if(typeof window!=='undefined'&&typeof document!=='undefined')waitForTeamStaff();
