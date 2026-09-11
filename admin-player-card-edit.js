function canEditPlayerFromPublicCard(role){return role==='admin';}

(function(root){
  let selectedRosterCard=null;

  function currentRole(){
    return document.body&&document.body.dataset?document.body.dataset.accessRole:'';
  }

  function displayName(fullName,nickname){
    const full=String(fullName||'').trim(),nick=String(nickname||'').trim();
    if(!nick)return full;
    if(!full)return nick;
    const firstSpace=full.indexOf(' ');
    return firstSpace<0?full+' "'+nick+'"':full.slice(0,firstSpace)+' "'+nick+'"'+full.slice(firstSpace);
  }

  function teamRoleLabel(role){if(role==='captain')return'KAPTEN';if(role==='vice_captain')return'VICEKAPTEN';return'';}
  function teamRoleMarker(role){if(role==='captain')return'(K)';if(role==='vice_captain')return'(VK)';return'';}

  function ensureInlineStyles(){
    if(document.getElementById('adminPlayerInlineEditStyles'))return;
    const style=document.createElement('style');
    style.id='adminPlayerInlineEditStyles';
    style.textContent='.player-public-profile-mobile-admin{margin:10px 0 0;color:#eee;font-size:16px}.player-public-profile-mobile-admin strong{color:#d6b65f;margin-right:7px}.player-public-profile-mobile-admin a{color:#fff;text-decoration:underline;text-underline-offset:3px}.player-public-profile.is-admin-editing{padding-bottom:calc(120px + env(safe-area-inset-bottom))!important;scroll-padding-bottom:calc(120px + env(safe-area-inset-bottom))}.player-public-profile-edit-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px auto 0;max-width:560px;padding:14px;border:1px solid rgba(214,182,95,.55);border-radius:16px;background:#171717;text-align:left}.player-public-profile-edit-form label{display:grid;gap:5px;font-size:12px;font-weight:800;color:#d6b65f}.player-public-profile-edit-form input,.player-public-profile-edit-form select{width:100%;min-height:44px;box-sizing:border-box;border:1px solid #555;border-radius:10px;padding:9px 10px;background:#fff;color:#111;font:inherit;font-size:16px}.player-public-profile-edit-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:8px}.player-public-profile-edit-actions button{min-height:44px;border:0;border-radius:10px;font-weight:850}.player-public-profile-edit-save{background:#d6b65f;color:#111}.player-public-profile-edit-cancel{background:#333;color:#fff}.player-public-profile-edit-error{grid-column:1/-1;margin:0;color:#ff9b9b;font-size:13px}@media(max-width:560px){.player-public-profile-edit-form{grid-template-columns:1fr}.player-public-profile-edit-actions,.player-public-profile-edit-error{grid-column:1}}';
    document.head.appendChild(style);
  }

  function addField(form,labelText,name,type,value){
    const label=document.createElement('label');
    label.textContent=labelText;
    const input=document.createElement('input');
    input.name=name;input.type=type;input.value=value||'';input.autocomplete='off';
    label.appendChild(input);form.appendChild(label);return input;
  }

  function addSelect(form,labelText,name,value,options){
    const label=document.createElement('label');label.textContent=labelText;
    const select=document.createElement('select');select.name=name;
    options.forEach(function(item){const option=document.createElement('option');option.value=item[0];option.textContent=item[1];select.appendChild(option);});
    select.value=value||'';label.appendChild(select);form.appendChild(label);return select;
  }

  async function resolveAdminMobile(playerId,playerMobile){
    const override=String(playerMobile||'').trim();
    if(override)return override;
    if(!root.kronangSupabase||!playerId)return'';
    const{data,error}=await root.kronangSupabase.from('player_contact_preferences').select('mobile_phone').eq('player_id',playerId).maybeSingle();
    if(error||!data)return'';
    const contactMobile=String(data.mobile_phone||'').trim();
    return playerMobile||contactMobile;
  }

  function removeDuplicatePhoneRows(profile){
    if(!profile)return;
    profile.querySelectorAll('.player-public-profile-phone').forEach(function(row){row.remove();});
  }

  function upsertAdminMobile(profile,mobile){
    if(!profile)return;
    removeDuplicatePhoneRows(profile);
    let row=profile.querySelector('.player-public-profile-mobile-admin');
    const value=String(mobile||'').trim();
    if(!value){if(row)row.remove();return;}
    if(!row){row=document.createElement('p');row.className='player-public-profile-mobile-admin';const label=document.createElement('strong');label.textContent='Mobil';const link=document.createElement('a');row.append(label,link);const role=profile.querySelector('.player-public-profile-role');const edit=profile.querySelector('.player-public-profile-edit');if(role)profile.insertBefore(row,role);else if(edit)profile.insertBefore(row,edit);else profile.appendChild(row);}
    const link=row.querySelector('a');if(link){link.href='tel:'+value.replace(/\s+/g,'');link.textContent=value;}
  }

  async function ensureAdminMobile(profile,playerId){
    if(!profile||!playerId||!root.kronangSupabase||profile.dataset.adminMobileLoading==='1')return;
    if(profile.querySelector('.player-public-profile-mobile-admin'))return;
    profile.dataset.adminMobileLoading='1';
    const{data,error}=await root.kronangSupabase.from('players').select('mobile_phone').eq('id',playerId).maybeSingle();
    if(error||!data){delete profile.dataset.adminMobileLoading;return;}
    const mobile=await resolveAdminMobile(playerId,data.mobile_phone);
    delete profile.dataset.adminMobileLoading;
    if(!profile.isConnected)return;
    ensureInlineStyles();upsertAdminMobile(profile,mobile);
  }

  function syncVisiblePlayerDetails(profile,payload){
    if(!profile||!payload)return;
    const positionValue=String(payload.position||'').trim();
    let position=profile.querySelector('.player-public-profile-position');
    if(positionValue){
      if(!position){position=document.createElement('p');position.className='player-public-profile-position';const signature=profile.querySelector('.player-public-profile-signature')||profile.querySelector('h2');if(signature)signature.insertAdjacentElement('afterend',position);else profile.appendChild(position);}
      position.textContent=positionValue;
    }else if(position)position.remove();

    const roleValue=teamRoleLabel(payload.team_role);
    let role=profile.querySelector('.player-public-profile-role');
    if(roleValue){
      if(!role){role=document.createElement('p');role.className='player-public-profile-role';const mobile=profile.querySelector('.player-public-profile-mobile-admin');if(mobile)mobile.insertAdjacentElement('afterend',role);else profile.appendChild(role);}
      role.textContent=roleValue;
    }else if(role)role.remove();

    upsertAdminMobile(profile,payload.mobile_phone);

    if(selectedRosterCard&&selectedRosterCard.isConnected){
      const cardName=selectedRosterCard.querySelector('.player-roster-card-title strong');
      if(cardName){const marker=teamRoleMarker(payload.team_role);cardName.textContent=displayName(payload.full_name,payload.nickname)+(marker?' '+marker:'');}
      const meta=selectedRosterCard.querySelector('.player-roster-card-meta');
      if(meta){
        const positions=['Målvakt','Försvarare','Mittfältare','Anfallare'];
        let cardPosition=Array.from(meta.querySelectorAll('span')).find(function(node){return positions.includes(node.textContent.trim());});
        if(positionValue){if(!cardPosition){cardPosition=document.createElement('span');meta.prepend(cardPosition);}cardPosition.textContent=positionValue;}else if(cardPosition)cardPosition.remove();
      }
    }
  }

  async function openInlineEditor(profile,playerId,triggerButton){
    if(!profile||!playerId||!root.kronangSupabase)return false;
    const existing=profile.querySelector('.player-public-profile-edit-form');
    if(existing){const first=existing.elements&&existing.elements.full_name;if(first)first.focus();return true;}
    triggerButton.disabled=true;
    const{data,error}=await root.kronangSupabase.from('players').select('id,full_name,nickname,mobile_phone,birth_date,shirt_number,position,team_role').eq('id',playerId).maybeSingle();
    triggerButton.disabled=false;
    if(error||!data)return false;
    const effectiveMobile=await resolveAdminMobile(playerId,data.mobile_phone);

    ensureInlineStyles();upsertAdminMobile(profile,effectiveMobile);profile.classList.add('is-admin-editing');
    const form=document.createElement('form');form.className='player-public-profile-edit-form';
    addField(form,'Namn','full_name','text',data.full_name);
    addField(form,'Smeknamn','nickname','text',data.nickname);
    addField(form,'Mobilnummer','mobile_phone','tel',effectiveMobile);
    addField(form,'Födelsedatum','birth_date','date',data.birth_date);
    const shirt=addField(form,'Tröjnummer','shirt_number','number',data.shirt_number===null?'':String(data.shirt_number));shirt.min='1';shirt.max='99';
    addSelect(form,'Position','position',data.position,[['','Ingen position'],['Målvakt','Målvakt'],['Försvarare','Försvarare'],['Mittfältare','Mittfältare'],['Anfallare','Anfallare']]);
    addSelect(form,'Lagroll','team_role',data.team_role,[['','Ingen lagroll'],['captain','Kapten'],['vice_captain','Vicekapten']]);
    const actions=document.createElement('div');actions.className='player-public-profile-edit-actions';
    const cancel=document.createElement('button');cancel.type='button';cancel.className='player-public-profile-edit-cancel';cancel.textContent='Avbryt';
    const save=document.createElement('button');save.type='submit';save.className='player-public-profile-edit-save';save.textContent='Spara';
    actions.append(cancel,save);form.appendChild(actions);
    const message=document.createElement('p');message.className='player-public-profile-edit-error';message.setAttribute('aria-live','polite');form.appendChild(message);
    cancel.onclick=function(){form.remove();profile.classList.remove('is-admin-editing');triggerButton.hidden=false;};
    form.onsubmit=async function(event){
      event.preventDefault();message.textContent='';
      const fullName=form.elements.full_name.value.trim();
      const shirtRaw=form.elements.shirt_number.value.trim();
      if(!fullName){message.textContent='Namn måste anges.';return;}
      if(shirtRaw){const n=Number(shirtRaw);if(!Number.isInteger(n)||n<1||n>99){message.textContent='Tröjnummer måste vara 1–99.';return;}}
      save.disabled=true;save.textContent='Sparar…';
      const payload={
        full_name:fullName,
        nickname:form.elements.nickname.value.trim()||null,
        mobile_phone:form.elements.mobile_phone.value.trim()||null,
        birth_date:form.elements.birth_date.value||null,
        shirt_number:shirtRaw?Number(shirtRaw):null,
        position:form.elements.position.value||null,
        team_role:form.elements.team_role.value||null,
        updated_at:new Date().toISOString()
      };
      const{error:updateError}=await root.kronangSupabase.from('players').update(payload).eq('id',playerId);
      if(updateError){save.disabled=false;save.textContent='Spara';message.textContent='Kunde inte spara spelaren. Försök igen.';return;}
      const title=profile.querySelector('.player-public-profile-signature')||profile.querySelector('h2');
      if(title)title.textContent=displayName(payload.full_name,payload.nickname);
      syncVisiblePlayerDetails(profile,payload);
      form.remove();profile.classList.remove('is-admin-editing');triggerButton.hidden=false;triggerButton.textContent='Sparat ✓';
      setTimeout(function(){triggerButton.textContent='Redigera spelare';},1200);
    };
    triggerButton.hidden=true;
    profile.appendChild(form);
    form.elements.full_name.focus();
    form.scrollIntoView({behavior:'smooth',block:'nearest'});
    return true;
  }

  function injectAdminPlayerEditAction(){
    if(typeof document==='undefined'||!canEditPlayerFromPublicCard(currentRole()))return;
    const profile=document.querySelector('.player-public-profile');
    if(!profile||!selectedRosterCard||!selectedRosterCard.isConnected)return;
    removeDuplicatePhoneRows(profile);
    const playerId=selectedRosterCard.dataset&&selectedRosterCard.dataset.playerId;
    if(playerId)ensureAdminMobile(profile,playerId);
    if(profile.querySelector('.player-public-profile-edit'))return;
    const button=document.createElement('button');
    button.type='button';button.className='player-public-profile-edit';button.textContent='Redigera spelare';
    button.style.display='block';button.style.margin='14px auto 0';button.style.padding='9px 16px';button.style.border='1px solid #d6b65f';button.style.borderRadius='999px';button.style.background='transparent';button.style.color='#f4d97e';button.style.fontWeight='800';
    button.onclick=async function(){
      if(!selectedRosterCard||!selectedRosterCard.isConnected)return;
      const id=selectedRosterCard.dataset&&selectedRosterCard.dataset.playerId;
      if(!id)return;
      const opened=await openInlineEditor(profile,id,button);
      if(!opened){button.disabled=false;button.textContent='Försök igen';setTimeout(function(){button.textContent='Redigera spelare';},1200);}
    };
    const archive=profile.querySelector('.player-public-profile-archive');
    if(archive)profile.insertBefore(button,archive);else profile.appendChild(button);
  }

  function setup(){
    if(typeof document==='undefined')return;
    document.addEventListener('click',function(event){
      const card=event.target&&event.target.closest?event.target.closest('.player-roster-card'):null;
      if(!card)return;
      if(event.target.closest('button,a,input,select,textarea,label'))return;
      selectedRosterCard=card;
      setTimeout(injectAdminPlayerEditAction,0);
    },true);
    document.addEventListener('kronang:access-state',function(){setTimeout(injectAdminPlayerEditAction,0);});
    if(typeof MutationObserver!=='undefined')new MutationObserver(injectAdminPlayerEditAction).observe(document.body,{childList:true,subtree:true});
  }

  if(root)root.KronangAdminPlayerCardEdit={canEditPlayerFromPublicCard:canEditPlayerFromPublicCard,openInlineEditor:openInlineEditor};
  if(typeof document!=='undefined')setup();
})(typeof window!=='undefined'?window:null);

if(typeof module!=='undefined'&&module.exports)module.exports={canEditPlayerFromPublicCard};
