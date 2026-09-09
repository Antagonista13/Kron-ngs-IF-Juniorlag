(function(root){
function smsUri(phone,body){
  const number=String(phone||'').replace(/[^+0-9]/g,'');
  const encoded=encodeURIComponent(String(body||''));
  const isiOS=/iPad|iPhone|iPod/.test((root.navigator&&root.navigator.userAgent)||'');
  return 'sms:'+number+(isiOS?'&body=':'?body=')+encoded;
}
function messageText(name,inviteUrl){
  return 'Kronängs IF Juniorlag\n\nHej '+String(name||'')+'!\nDu är inbjuden till lagets spelarapp. Här kan du följa träningar, mål och din egen utveckling tillsammans med tränarna.\n\nTryck på länken för att skapa ditt konto:\n'+inviteUrl+'\n\n/Kronängs IF';
}
async function loadInvitePlayers(select){
  if(!root.kronangSupabase||!select)return;
  const result=await root.kronangSupabase.from('players').select('id,full_name,profile_id,is_active').eq('is_active',true).order('full_name',{ascending:true});
  if(result.error)return;
  select.innerHTML='<option value="">Välj spelare…</option>'+(result.data||[]).filter(function(player){return !player.profile_id;}).map(function(player){return '<option value="'+player.id+'">'+String(player.full_name||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</option>';}).join('');
}
function ensureSmsControls(form){
  let field=document.getElementById('adminInvitePlayerField');
  if(!field){
    field=document.createElement('label');field.id='adminInvitePlayerField';field.hidden=true;field.textContent='Spelare';
    const select=document.createElement('select');select.id='adminInvitePlayer';select.innerHTML='<option value="">Välj spelare…</option>';field.appendChild(select);
    const functionField=document.getElementById('adminInviteFunctionField');if(functionField)form.insertBefore(field,functionField);else form.appendChild(field);
  }
  let button=document.getElementById('adminInviteSmsButton');
  if(!button){button=document.createElement('button');button.type='button';button.id='adminInviteSmsButton';button.className='secondary';button.hidden=true;button.textContent='BJUD IN VIA SMS';const submit=form.querySelector('button[type="submit"]');if(submit)form.insertBefore(button,submit.nextSibling);else form.appendChild(button);}
  return {field:field,select:field.querySelector('select'),button:button};
}
function setup(){
  if(!root.kronangSupabase||!root.document)return;
  const form=document.getElementById('adminInviteForm'),role=document.getElementById('adminInviteRole');if(!form||!role)return;
  const controls=ensureSmsControls(form),message=document.getElementById('adminInviteMessage'),name=document.getElementById('adminInviteName'),email=document.getElementById('adminInviteEmail');
  const sync=function(){const player=role.value==='player';controls.field.hidden=!player;controls.button.hidden=!player;if(player)loadInvitePlayers(controls.select);};
  if(!role.dataset.smsReady){role.dataset.smsReady='1';role.addEventListener('change',sync);}
  if(controls.select&&!controls.select.dataset.smsReady){controls.select.dataset.smsReady='1';controls.select.addEventListener('change',function(){const option=controls.select.options[controls.select.selectedIndex];if(option&&option.value&&name&&!String(name.value||'').trim())name.value=option.textContent||'';});}
  if(!controls.button.dataset.smsReady){controls.button.dataset.smsReady='1';controls.button.addEventListener('click',async function(){
    if(role.value!=='player'){if(message)message.textContent='SMS-inbjudan är endast för spelare.';return;}
    const playerId=String(controls.select&&controls.select.value||'').trim(),fullName=String(name&&name.value||'').trim(),mail=String(email&&email.value||'').trim();
    if(!playerId){if(message)message.textContent='Välj spelaren som ska bjudas in.';return;}
    if(!fullName){if(message)message.textContent='Ange spelarens namn.';return;}
    if(!/^\S+@\S+\.\S+$/.test(mail)){if(message)message.textContent='Ange spelarens e-postadress.';return;}
    controls.button.disabled=true;if(message)message.textContent='Skapar säker SMS-inbjudan…';
    const result=await root.kronangSupabase.functions.invoke('create-player-sms-invite',{body:{playerId:playerId,email:mail,fullName:fullName}});
    controls.button.disabled=false;
    if(result.error||!result.data||!result.data.inviteUrl||!result.data.phone){if(message)message.textContent='SMS-inbjudan kunde inte skapas. Kontrollera att spelaren har mobilnummer och inget befintligt konto.';return;}
    const text=messageText(result.data.playerName||fullName,result.data.inviteUrl);if(message)message.textContent='SMS är förberett – tryck på Skicka i Meddelanden.';
    root.location.href=smsUri(result.data.phone,text);
  });}
  sync();
}
function wait(){if(root.kronangSupabase&&root.document&&document.getElementById('adminInviteForm'))setup();else root.setTimeout(wait,100);}
if(typeof module!=='undefined'&&module.exports)module.exports={smsUri,messageText};
if(root.document)wait();
})(typeof window!=='undefined'?window:globalThis);
