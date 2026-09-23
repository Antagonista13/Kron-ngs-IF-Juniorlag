(function(root){
const BUCKET='weekly-tips';
let profile=null,current=null;

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

async function signed(path){
  if(!path)return '';
  const {data,error}=await root.kronangSupabase.storage.from(BUCKET).createSignedUrl(path,3600);
  if(error){console.error('Kunde inte skapa bildlänk:',error);return '';}
  return data&&data.signedUrl||'';
}

function ensureModal(){
  let modal=document.getElementById('weeklyTipModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='weeklyTipModal'; modal.className='weekly-tip-modal'; modal.hidden=true;
  modal.innerHTML='<div class="weekly-tip-dialog" role="dialog" aria-modal="true" aria-labelledby="weeklyTipDialogTitle"><button class="weekly-tip-close" type="button" aria-label="Stäng">×</button><div id="weeklyTipDialogBody"></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.weekly-tip-close'))closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  return modal;
}
function openModal(){const m=ensureModal();m.hidden=false;document.body.classList.add('weekly-tip-open');}
function closeModal(){const m=document.getElementById('weeklyTipModal');if(m)m.hidden=true;document.body.classList.remove('weekly-tip-open');}

async function renderCard(){
  const card=document.getElementById('homeWeeklyTipCard'); if(!card)return;
  if(!current){card.hidden=true;return;}
  card.hidden=false;
  const img=card.querySelector('.weekly-tip-image'),title=card.querySelector('.weekly-tip-title'),text=card.querySelector('.weekly-tip-preview');
  title.textContent=current.title||'Veckans tips';
  text.textContent=current.body||'';
  if(current.image_path){
    const url=await signed(current.image_path);
    if(url){img.src=url;img.hidden=false;}else img.hidden=true;
  } else img.hidden=true;
}

async function showTip(){
  if(!current)return;
  const body=document.getElementById('weeklyTipDialogBody')||ensureModal().querySelector('#weeklyTipDialogBody');
  const url=current.image_path?await signed(current.image_path):'';
  body.innerHTML='<div class="weekly-tip-full">'+(url?'<img src="'+esc(url)+'" alt="">':'')+'<span class="weekly-tip-kicker">VECKANS TIPS</span><h2 id="weeklyTipDialogTitle">'+esc(current.title)+'</h2><p>'+esc(current.body).replace(/\n/g,'<br>')+'</p>'+(profile&&profile.role==='admin'?'<button type="button" class="weekly-tip-edit">REDIGERA</button>':'')+'</div>';
  const edit=body.querySelector('.weekly-tip-edit');if(edit)edit.addEventListener('click',showEditor);
  openModal();
}

function fileExt(file){const n=(file&&file.name||'').toLowerCase();return n.includes('.')?n.split('.').pop():'jpg';}
function teamStorageKey(team){return String(team||'').trim().toLocaleLowerCase('sv-SE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');}
async function uploadImage(file){
  const teamKey=teamStorageKey(profile.team);
  if(!teamKey)throw new Error('Lagnamnet kunde inte användas för bildlagring.');
  const path=teamKey+'/'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+fileExt(file);
  const {error}=await root.kronangSupabase.storage.from(BUCKET).upload(path,file,{contentType:file.type||'image/jpeg',cacheControl:'3600'});
  if(error)throw error; return path;
}

async function showEditor(){
  if(!profile||profile.role!=='admin')return;
  const body=document.getElementById('weeklyTipDialogBody')||ensureModal().querySelector('#weeklyTipDialogBody');
  const url=current&&current.image_path?await signed(current.image_path):'';
  body.innerHTML='<form class="weekly-tip-editor" id="weeklyTipForm"><span class="weekly-tip-kicker">ADMIN</span><h2 id="weeklyTipDialogTitle">'+(current?'Redigera veckans tips':'Nytt veckans tips')+'</h2>'+(url?'<img class="weekly-tip-editor-preview" src="'+esc(url)+'" alt="">':'')+'<label>Bild<input id="weeklyTipFile" type="file" accept="image/*"></label><label>Rubrik<input id="weeklyTipTitle" maxlength="120" required value="'+esc(current&&current.title||'')+'"></label><label>Text<textarea id="weeklyTipText" maxlength="1200" rows="6" required>'+esc(current&&current.body||'')+'</textarea></label><p class="weekly-tip-message" id="weeklyTipMessage"></p><div class="weekly-tip-actions"><button type="submit">PUBLICERA</button>'+(current?'<button type="button" class="secondary" id="weeklyTipDelete">TA BORT</button>':'')+'<button type="button" class="secondary" id="weeklyTipCancel">AVBRYT</button></div></form>';
  const form=body.querySelector('#weeklyTipForm'),file=body.querySelector('#weeklyTipFile'),msg=body.querySelector('#weeklyTipMessage');
  body.querySelector('#weeklyTipCancel').addEventListener('click',()=>current?showTip():closeModal());
  const del=body.querySelector('#weeklyTipDelete'); if(del)del.addEventListener('click',removeTip);
  file.addEventListener('change',()=>{const f=file.files&&file.files[0];if(!f)return;const p=body.querySelector('.weekly-tip-editor-preview')||document.createElement('img');p.className='weekly-tip-editor-preview';p.src=URL.createObjectURL(f);if(!p.parentNode)form.insertBefore(p,form.querySelector('label'));});
  form.addEventListener('submit',async e=>{
    e.preventDefault(); const btn=form.querySelector('button[type="submit"]');btn.disabled=true;msg.textContent='Publicerar…';
    try{
      let imagePath=current&&current.image_path||null;
      const selected=file.files&&file.files[0];
      if(selected){
        if(!String(selected.type||'').startsWith('image/'))throw new Error('Välj en bildfil.');
        if(selected.size>10*1024*1024)throw new Error('Bilden är för stor. Välj en bild under 10 MB.');
        imagePath=await uploadImage(selected);
      }
      const row={team:profile.team,title:body.querySelector('#weeklyTipTitle').value.trim(),body:body.querySelector('#weeklyTipText').value.trim(),image_path:imagePath,updated_by:profile.id,updated_at:new Date().toISOString()};
      if(!row.title||!row.body)throw new Error('Rubrik och text måste fyllas i.');
      const {error}=await root.kronangSupabase.from('team_weekly_tips').upsert(row,{onConflict:'team'}); if(error)throw error;
      if(selected&&current&&current.image_path&&current.image_path!==imagePath)await root.kronangSupabase.storage.from(BUCKET).remove([current.image_path]);
      await load(); await showTip();
    }catch(err){console.error(err);msg.textContent=err.message||'Det gick inte att publicera tipset.';}
    finally{btn.disabled=false;}
  });
  openModal();
}

async function removeTip(){
  if(!current||!profile||profile.role!=='admin')return;
  if(!confirm('Ta bort veckans tips?'))return;
  const old=current.image_path;
  const {error}=await root.kronangSupabase.from('team_weekly_tips').delete().eq('team',profile.team);
  if(error){alert('Tipset kunde inte tas bort.');return;}
  if(old)await root.kronangSupabase.storage.from(BUCKET).remove([old]);
  current=null;closeModal();await load();
}

async function load(){
  if(!root.kronangSupabase)return;
  const {data:sessionData}=await root.kronangSupabase.auth.getSession();const user=sessionData.session&&sessionData.session.user;if(!user)return;
  const {data:p}=await root.kronangSupabase.from('profiles').select('id,role,team,is_active').eq('id',user.id).maybeSingle();
  profile=p;if(!p||p.is_active===false||!['admin','coach','player'].includes(p.role)||!p.team){const c=document.getElementById('homeWeeklyTipCard');if(c)c.hidden=true;return;}
  const {data,error}=await root.kronangSupabase.from('team_weekly_tips').select('team,title,body,image_path,updated_at').eq('team',p.team).maybeSingle();
  if(error){console.error('Kunde inte hämta veckans tips:',error);return;}
  current=data||null;await renderCard();
  const card=document.getElementById('homeWeeklyTipCard');if(card&&!card.dataset.bound){card.dataset.bound='1';card.addEventListener('click',showTip);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showTip();}});}
  if(p.role==='admin'&&!current){card.hidden=false;card.classList.add('weekly-tip-empty-admin');card.querySelector('.weekly-tip-title').textContent='Lägg till veckans tips';card.querySelector('.weekly-tip-preview').textContent='Välj en bild från mobilen och skriv några rader.';card.addEventListener('click',showEditor,{once:true});}
}
function wait(){if(root.kronangSupabase)load();else setTimeout(wait,120);}
if(typeof document!=='undefined'){document.addEventListener('kronang:auth-signed-in',()=>setTimeout(load,100));wait();}
root.KronangWeeklyTip={load,showEditor};
})(typeof window!=='undefined'?window:{});