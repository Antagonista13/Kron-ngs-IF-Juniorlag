function buildTeamStaffMember(row){
  const item=row||{};
  const phone=(item.phone||'').trim();
  const email=(item.email||'').trim();
  return {
    id:item.id||'',
    name:(item.display_name||'').trim(),
    role:(item.staff_role||'').trim(),
    description:(item.description||'').trim(),
    sortOrder:Number.isFinite(Number(item.sort_order))?Number(item.sort_order):0,
    phone:phone,
    email:email,
    avatarUrl:(item.avatar_url||'').trim(),
    phoneHref:phone?'tel:'+phone.replace(/\s+/g,''):'',
    emailHref:email?'mailto:'+email:''
  };
}

function buildStaffFallbackIcon(){
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/></svg>';
}

function renderStaffRows(rows){
  const page=document.getElementById('teamPage');
  if(!page)return;
  let section=document.getElementById('teamStaffSection');
  if(!section){section=document.createElement('section');section.id='teamStaffSection';section.className='team-staff-section';page.appendChild(section);}
  section.innerHTML='<div class="team-staff-heading"><span>LAGET</span><h2>Ledarstaben</h2><p>Snabb kontakt när du behöver få tag i någon.</p></div>';
  const list=document.createElement('div');list.className='team-staff-list';
  (rows||[]).map(buildTeamStaffMember).filter(function(member){return member.name;}).forEach(function(member){
    const card=document.createElement('article');card.className='team-staff-card';card.dataset.staffId=member.id;
    const avatar=document.createElement('div');avatar.className='team-staff-avatar';
    if(member.avatarUrl){const img=document.createElement('img');img.src=member.avatarUrl;img.alt='Profilbild för '+member.name;avatar.appendChild(img);}else{avatar.innerHTML=buildStaffFallbackIcon();}
    const copy=document.createElement('div');copy.className='team-staff-copy';
    const name=document.createElement('strong');name.textContent=member.name;
    const role=document.createElement('span');role.textContent=member.role||'Ledare';copy.append(name,role);
    if(member.description){const description=document.createElement('p');description.className='team-staff-description';description.textContent=member.description;copy.appendChild(description);}
    const actions=document.createElement('div');actions.className='team-staff-actions';
    if(member.phoneHref){const a=document.createElement('a');a.href=member.phoneHref;a.setAttribute('aria-label','Ring '+member.name);a.textContent='Ring';actions.appendChild(a);}
    if(member.emailHref){const a=document.createElement('a');a.href=member.emailHref;a.setAttribute('aria-label','Mejla '+member.name);a.textContent='Mejl';actions.appendChild(a);}
    card.append(avatar,copy,actions);list.appendChild(card);
  });
  if(!list.children.length){const empty=document.createElement('p');empty.className='team-staff-empty';empty.textContent='Kontaktuppgifter till ledarstaben är inte publicerade ännu.';section.appendChild(empty);}else{section.appendChild(list);}
}

async function loadTeamStaff(){
  if(!window.kronangSupabase)return;
  const {data:sessionData}=await window.kronangSupabase.auth.getSession();
  const user=sessionData.session?sessionData.session.user:null;if(!user)return;
  const {data:profile}=await window.kronangSupabase.from('profiles').select('team').eq('id',user.id).maybeSingle();
  if(!profile||!profile.team)return;
  const {data,error}=await window.kronangSupabase.from('team_staff').select('id, display_name, staff_role, description, phone, email, avatar_url, sort_order').eq('team',profile.team).eq('is_active',true).order('sort_order',{ascending:true}).order('display_name',{ascending:true});
  if(error){console.warn('Ledarstaben kunde inte hämtas ännu:',error.message||error);renderStaffRows([]);return;}
  renderStaffRows(data||[]);
}

function waitForTeamStaff(){if(window.kronangSupabase){loadTeamStaff();return;}setTimeout(waitForTeamStaff,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={buildTeamStaffMember};
if(typeof window!=='undefined'&&typeof document!=='undefined')waitForTeamStaff();
