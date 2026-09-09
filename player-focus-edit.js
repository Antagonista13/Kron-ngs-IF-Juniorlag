(function(root){
  function buildFocusUpdateRequest(focusId, area, focusText, attentionText){
    return {
      p_focus_id: focusId,
      p_development_area: (area || '').trim(),
      p_focus_text: (focusText || '').trim(),
      p_attention_text: (attentionText || '').trim()
    };
  }

  function createOption(value, label){
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }

  async function getPlayerActiveFocus(){
    if(!root || !root.kronangSupabase) return null;
    const db = root.kronangSupabase;
    const sessionResult = await db.auth.getSession();
    const user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if(!user) return null;
    const profileResult = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if(!profileResult.data || profileResult.data.role !== 'player') return null;
    const focusResult = await db.from('development_focuses')
      .select('id,development_area,focus_text,attention_text,lifecycle_status')
      .eq('player_id', user.id)
      .eq('lifecycle_status', 'active')
      .order('created_at', { ascending:false })
      .limit(1)
      .maybeSingle();
    if(focusResult.error) throw focusResult.error;
    return focusResult.data || null;
  }

  function renderEditFocusForm(summary, focus){
    if(!summary || !focus || summary.querySelector('[data-player-focus-edit-form]')) return;
    const existingChildren = Array.from(summary.children);
    existingChildren.forEach(function(el){ el.dataset.playerFocusPreviousDisplay = el.style.display || ''; el.style.display = 'none'; });

    const form = document.createElement('div');
    form.setAttribute('data-player-focus-edit-form','true');
    form.style.display='flex';
    form.style.flexDirection='column';
    form.style.gap='12px';

    const heading=document.createElement('h3'); heading.textContent='Ändra fokus';
    const areaLabel=document.createElement('label'); areaLabel.textContent='Utvecklingsområde'; areaLabel.style.fontWeight='700';
    const area=document.createElement('select'); area.id='playerFocusEditArea';
    area.append(
      createOption('technique','Teknik'),
      createOption('game_understanding','Spelförståelse'),
      createOption('physical','Fys'),
      createOption('mentality','Mentalitet')
    );
    area.value=focus.development_area || '';

    const focusLabel=document.createElement('label'); focusLabel.textContent='Vad vill du fokusera på?'; focusLabel.style.fontWeight='700';
    const focusText=document.createElement('input'); focusText.type='text'; focusText.maxLength=160; focusText.value=focus.focus_text || '';
    const attentionLabel=document.createElement('label'); attentionLabel.textContent='Vad ska du tänka på?'; attentionLabel.style.fontWeight='700';
    const attention=document.createElement('textarea'); attention.rows=4; attention.maxLength=1000; attention.value=focus.attention_text || '';
    [area,focusText,attention].forEach(function(field){field.style.width='100%';field.style.boxSizing='border-box';field.style.padding='12px';field.style.border='1px solid #bdbdbd';field.style.borderRadius='10px';field.style.font='inherit';field.style.background='#fff';});

    const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='10px'; actions.style.flexWrap='wrap';
    const save=document.createElement('button'); save.type='button'; save.textContent='SPARA FOKUS'; save.className='primary-button';
    const cancel=document.createElement('button'); cancel.type='button'; cancel.textContent='AVBRYT';
    const message=document.createElement('p'); message.style.margin='0';
    actions.append(save,cancel);
    form.append(heading,areaLabel,area,focusLabel,focusText,attentionLabel,attention,actions,message);
    summary.appendChild(form);

    function restore(){
      form.remove();
      existingChildren.forEach(function(el){ el.style.display = el.dataset.playerFocusPreviousDisplay || ''; delete el.dataset.playerFocusPreviousDisplay; });
    }
    cancel.addEventListener('click', restore);
    save.addEventListener('click', async function(){
      const request = buildFocusUpdateRequest(focus.id, area.value, focusText.value, attention.value);
      if(!request.p_development_area || !request.p_focus_text || !request.p_attention_text){ message.textContent='Fyll i alla fält.'; return; }
      save.disabled=true; cancel.disabled=true; message.textContent='';
      const result = await root.kronangSupabase.rpc('update_my_active_development_focus', request);
      if(result.error){ message.textContent='Fokuset kunde inte sparas.'; save.disabled=false; cancel.disabled=false; return; }
      if(root.sessionStorage) root.sessionStorage.setItem('kronangReturnPage','developmentPage');
      root.location.reload();
    });
  }

  async function ensureEditButton(){
    const summary=document.getElementById('developmentFocusSummary');
    if(!summary || summary.hidden || summary.querySelector('[data-player-focus-edit]') || summary.querySelector('[data-player-focus-edit-form]')) return;
    if(!summary.querySelector('h2')) return;
    const focus=await getPlayerActiveFocus();
    if(!focus) return;
    const button=document.createElement('button');
    button.type='button';
    button.textContent='ÄNDRA FOKUS';
    button.className='secondary';
    button.setAttribute('data-player-focus-edit','true');
    button.style.marginTop='14px';
    button.addEventListener('click', function(){ renderEditFocusForm(summary, focus); });
    summary.appendChild(button);
  }

  function schedule(){ setTimeout(function(){ ensureEditButton().catch(function(err){ console.error('Fokusredigering:',err); }); },120); }

  if(typeof module!=='undefined' && module.exports) module.exports={ buildFocusUpdateRequest };
  if(typeof document!=='undefined' && root){
    const observer=new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('click',function(ev){ if(ev.target.closest && ev.target.closest('.nav-item[data-page="developmentPage"]')) schedule(); });
    setTimeout(schedule,900);
  }
})(typeof window!=='undefined'?window:null);
