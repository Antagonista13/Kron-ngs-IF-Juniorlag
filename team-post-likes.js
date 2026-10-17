// Lightweight, non-notifying reactions for existing team posts.
(function () {
  'use strict';
  const icon='<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3Zm0 0 4-8a3 3 0 0 1 2 3v3h6.1a3 3 0 0 1 2.95 3.55l-1.3 7A3 3 0 0 1 17.8 21H7"/></svg>';
  let userId=null, watcher=null, refreshTimer=null;
  const supabase=()=>window.kronangSupabase;
  const validId=id=>/^[0-9a-f-]{36}$/i.test(String(id||''));
  const escapeHtml=text=>String(text||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function identity(){
    if(userId)return userId;
    if(!supabase())return null;
    const {data,error}=await supabase().auth.getUser();
    if(error||!data?.user)return null;
    userId=data.user.id;
    return userId;
  }

  function update(card,people){
    const bar=card.querySelector('.team-post-reactions');
    if(!bar)return;
    const names=Array.isArray(people)?people:[];
    const liked=names.some(p=>p.profile_id===userId);
    const like=bar.querySelector('.team-post-like-button');
    like.classList.toggle('is-liked',liked);
    like.setAttribute('aria-pressed',String(liked));
    like.setAttribute('aria-label',liked?'Ta bort gilla-markering':'Gilla inlägget');
    const count=bar.querySelector('.team-post-like-count');
    count.textContent=names.length+' gillar';
    count.setAttribute('aria-label','Visa vilka som gillar inlägget ('+names.length+')');
    const list=bar.querySelector('.team-post-like-names');
    list.innerHTML=names.length?'<strong>Gillat av</strong><span>'+names.map(p=>escapeHtml(p.display_name)).join(', ')+'</span>':'Ingen har gillat ännu.';
  }

  async function refresh(card){
    if(!card?.isConnected||!validId(card.dataset.postId)||!supabase())return;
    const {data,error}=await supabase().rpc('team_post_likers',{p_post_id:card.dataset.postId});
    if(error){console.warn('Kunde inte läsa gilla-markeringar:',error);return;}
    update(card,data);
  }

  function attach(card){
    if(card.querySelector('.team-post-reactions')||!validId(card.dataset.postId))return;
    const bar=document.createElement('div');
    bar.className='team-post-reactions';
    bar.innerHTML='<button type="button" class="team-post-like-button" aria-pressed="false" aria-label="Gilla inlägget">'+icon+'<span>Gilla</span></button><button type="button" class="team-post-like-count" aria-expanded="false" aria-label="Visa vilka som gillar inlägget">0 gillar</button><div class="team-post-like-names" hidden></div>';
    const manage=card.querySelector('.team-post-manage');
    if(manage)card.insertBefore(bar,manage);else card.appendChild(bar);
    // Prevent the collapsible post click handler from hijacking reaction controls.
    bar.addEventListener('click',event=>event.stopPropagation());
    bar.addEventListener('keydown',event=>event.stopPropagation());
    const button=bar.querySelector('.team-post-like-button');
    button.addEventListener('click',async()=>{
      if(button.disabled)return;
      button.disabled=true;
      try {
        const {error}=await supabase().rpc('toggle_team_post_like',{p_post_id:card.dataset.postId});
        if(error)throw error;
        await refresh(card);
      }catch(error){console.error('Kunde inte ändra gilla-markering:',error);window.alert('Gilla-markeringen kunde inte sparas. Försök igen.');}
      finally{button.disabled=false;}
    });
    bar.querySelector('.team-post-like-count').addEventListener('click',()=>{
      const list=bar.querySelector('.team-post-like-names'),count=bar.querySelector('.team-post-like-count');
      list.hidden=!list.hidden;
      count.setAttribute('aria-expanded',String(!list.hidden));
    });
    refresh(card);
  }
  function scan(){
    document.querySelectorAll('#teamPostsList .team-post[data-post-id]').forEach(attach);
  }
  async function start(){
    if(!supabase())return;
    if(!await identity())return;
    if(!watcher){
      const page=document.getElementById('teamPage');
      if(!page)return;
      watcher=new MutationObserver(scan);
      watcher.observe(page,{subtree:true,childList:true});
    }
    scan();
    if(!refreshTimer)refreshTimer=setInterval(()=>{
      if(document.visibilityState==='visible'&&!document.getElementById('teamPage')?.hidden)
        document.querySelectorAll('#teamPostsList .team-post[data-post-id]').forEach(refresh);
    },15000);
  }
  function reset(){userId=null;}
  document.addEventListener('kronang:app-start-reset',reset);
  document.addEventListener('kronang:auth-signed-in',start);
  document.addEventListener('kronang:team-page-opened',start);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
