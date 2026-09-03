function normalizePlayer(row){
  const item=row||{};
  return {
    id:item.id||'',
    name:(item.full_name||'').trim(),
    mobile:(item.mobile_phone||'').trim(),
    birthDate:item.birth_date||'',
    shirtNumber:item.shirt_number===null||item.shirt_number===undefined||item.shirt_number===''?'':Number(item.shirt_number),
    isActive:item.is_active!==false,
    profileId:item.profile_id||null
  };
}

function validatePlayerInput(input){
  const item=input||{};
  const name=(item.name||item.full_name||'').trim();
  const mobile=(item.mobile||item.mobile_phone||'').trim();
  const birthDate=item.birthDate||item.birth_date||'';
  const raw=item.shirtNumber!==undefined?item.shirtNumber:item.shirt_number;
  const errors=[];
  let shirtNumber='';
  if(!name)errors.push('Namn måste anges.');
  if(raw!==''&&raw!==null&&raw!==undefined){
    shirtNumber=Number(raw);
    if(!Number.isInteger(shirtNumber)||shirtNumber<1||shirtNumber>99)errors.push('Tröjnummer måste vara 1–99.');
  }
  if(birthDate&&!/^\d{4}-\d{2}-\d{2}$/.test(birthDate))errors.push('Födelsedatum är ogiltigt.');
  return {ok:errors.length===0,errors,value:{full_name:name,mobile_phone:mobile||null,birth_date:birthDate||null,shirt_number:shirtNumber===''?null:shirtNumber}};
}

function formatSwedishBirthDate(isoDate){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(isoDate||''))return '';
  const parts=isoDate.split('-').map(Number);
  const months=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
  if(parts[1]<1||parts[1]>12)return '';
  return parts[2]+' '+months[parts[1]-1]+' '+parts[0];
}

function canManageRoster(role){return role==='coach'||role==='admin';}

function buildRosterCardModel(row){
  const p=normalizePlayer(row);
  return {
    name:p.name,
    number:p.shirtNumber===''?'':'#'+p.shirtNumber,
    mobile:p.mobile,
    birthDate:formatSwedishBirthDate(p.birthDate),
    actionLabel:p.isActive?'Ta bort från truppen':'Återaktivera',
    isActive:p.isActive
  };
}

function makeRosterField(labelText,type,name){
  const label=document.createElement('label');
  label.className='player-roster-field';
  const span=document.createElement('span');span.textContent=labelText;
  const input=document.createElement('input');input.type=type;input.name=name;input.autocomplete='off';
  label.append(span,input);
  return label;
}

function ensureRosterSection(){
  const page=document.getElementById('teamPage');
  if(!page)return null;
  let section=document.getElementById('playerRosterSection');
  if(section)return section;
  section=document.createElement('section');
  section.id='playerRosterSection';
  section.className='player-roster-section';
  section.innerHTML='<div class="player-roster-heading"><div><span>LEDARVY</span><h2>Spelartrupp</h2><p>Hantera juniorlagets spelare, kontaktuppgifter och tröjnummer.</p></div><button type="button" class="player-roster-add">+ Lägg till spelare</button></div><div class="player-roster-status" aria-live="polite"></div><div class="player-roster-list" data-roster-active></div><details class="player-roster-inactive"><summary>Spelare utanför truppen <span data-inactive-count>0</span></summary><div class="player-roster-list" data-roster-inactive></div></details>';
  const form=document.createElement('form');form.className='player-roster-form';form.hidden=true;
  form.append(makeRosterField('Namn','text','full_name'),makeRosterField('Mobilnummer','tel','mobile_phone'),makeRosterField('Födelsedatum','date','birth_date'),makeRosterField('Tröjnummer','number','shirt_number'));
  const actions=document.createElement('div');actions.className='player-roster-form-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.className='player-roster-cancel';cancel.textContent='Avbryt';
  const save=document.createElement('button');save.type='submit';save.className='player-roster-save';save.textContent='Spara spelare';
  actions.append(cancel,save);form.appendChild(actions);
  const error=document.createElement('p');error.className='player-roster-form-error';error.setAttribute('aria-live','polite');form.appendChild(error);
  section.appendChild(form);page.appendChild(section);
  return section;
}

function renderRosterCard(row,section,onEdit,onToggle){
  const p=normalizePlayer(row), model=buildRosterCardModel(row);
  const card=document.createElement('article');card.className='player-roster-card'+(model.isActive?'':' is-inactive');
  const main=document.createElement('div');main.className='player-roster-card-main';
  const title=document.createElement('div');title.className='player-roster-card-title';
  const name=document.createElement('strong');name.textContent=model.name;
  title.appendChild(name);
  if(model.number){const number=document.createElement('span');number.textContent=model.number;title.appendChild(number);}
  main.appendChild(title);
  const meta=document.createElement('div');meta.className='player-roster-card-meta';
  if(model.mobile){const phone=document.createElement('a');phone.href='tel:'+model.mobile.replace(/\s+/g,'');phone.textContent=model.mobile;meta.appendChild(phone);}
  if(model.birthDate){const birth=document.createElement('span');birth.textContent=model.birthDate;meta.appendChild(birth);}
  if(!meta.children.length){const empty=document.createElement('span');empty.textContent='Inga kontaktuppgifter registrerade';meta.appendChild(empty);}
  main.appendChild(meta);
  const actions=document.createElement('div');actions.className='player-roster-card-actions';
  const edit=document.createElement('button');edit.type='button';edit.textContent='Redigera';edit.addEventListener('click',function(){onEdit(p);});
  const toggle=document.createElement('button');toggle.type='button';toggle.textContent=model.actionLabel;toggle.addEventListener('click',function(){onToggle(p);});
  actions.append(edit,toggle);card.append(main,actions);return card;
}

function setupPlayerRoster(){
  if(!window.kronangSupabase)return;
  let currentEdit=null;
  async function start(){
    const {data:sessionData}=await window.kronangSupabase.auth.getSession();
    const user=sessionData.session?sessionData.session.user:null;if(!user)return;
    const {data:profile}=await window.kronangSupabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if(!profile||!canManageRoster(profile.role))return;
    const section=ensureRosterSection();if(!section)return;
    const form=section.querySelector('.player-roster-form');
    const status=section.querySelector('.player-roster-status');
    const error=section.querySelector('.player-roster-form-error');
    function closeForm(){currentEdit=null;form.reset();form.hidden=true;error.textContent='';}
    function openForm(player){
      currentEdit=player||null;form.hidden=false;error.textContent='';
      form.elements.full_name.value=player?player.name:'';
      form.elements.mobile_phone.value=player?player.mobile:'';
      form.elements.birth_date.value=player?player.birthDate:'';
      form.elements.shirt_number.value=player&&player.shirtNumber!==''?player.shirtNumber:'';
      form.elements.full_name.focus();
    }
    async function load(){
      status.textContent='Hämtar spelartruppen…';
      const {data,error:loadError}=await window.kronangSupabase.from('players').select('id,full_name,mobile_phone,birth_date,shirt_number,is_active,profile_id').order('full_name',{ascending:true});
      if(loadError){status.textContent='Spelartruppen kan inte hämtas ännu. Databasmigrationen kan behöva köras.';return;}
      status.textContent='';
      const active=section.querySelector('[data-roster-active]');const inactive=section.querySelector('[data-roster-inactive]');active.innerHTML='';inactive.innerHTML='';
      (data||[]).forEach(function(row){const target=row.is_active===false?inactive:active;target.appendChild(renderRosterCard(row,section,openForm,toggleActive));});
      if(!active.children.length){const empty=document.createElement('p');empty.className='player-roster-empty';empty.textContent='Inga aktiva spelare registrerade ännu.';active.appendChild(empty);}
      section.querySelector('[data-inactive-count]').textContent=inactive.children.length;
    }
    async function toggleActive(player){
      const next=!player.isActive;
      const {error:updateError}=await window.kronangSupabase.from('players').update({is_active:next,updated_at:new Date().toISOString()}).eq('id',player.id);
      if(updateError){status.textContent='Kunde inte ändra spelarens status.';return;}await load();
    }
    section.querySelector('.player-roster-add').onclick=function(){openForm(null);};
    section.querySelector('.player-roster-cancel').onclick=closeForm;
    form.onsubmit=async function(event){
      event.preventDefault();
      const result=validatePlayerInput({name:form.elements.full_name.value,mobile:form.elements.mobile_phone.value,birthDate:form.elements.birth_date.value,shirtNumber:form.elements.shirt_number.value});
      if(!result.ok){error.textContent=result.errors.join(' ');return;}
      const payload=Object.assign({},result.value,{updated_at:new Date().toISOString()});
      let response;
      if(currentEdit&&currentEdit.id)response=await window.kronangSupabase.from('players').update(payload).eq('id',currentEdit.id);
      else response=await window.kronangSupabase.from('players').insert(Object.assign({},payload,{is_active:true}));
      if(response.error){error.textContent='Kunde inte spara spelaren. Försök igen.';return;}
      closeForm();await load();
    };
    await load();
  }
  document.addEventListener('kronang:auth-signed-in',start);
  start();
}

function waitForPlayerRoster(){if(window.kronangSupabase){setupPlayerRoster();return;}setTimeout(waitForPlayerRoster,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={normalizePlayer,validatePlayerInput,formatSwedishBirthDate,canManageRoster,buildRosterCardModel};
if(typeof window!=='undefined'&&typeof document!=='undefined')waitForPlayerRoster();
