function teamPostPreview(value,maxLength){
  const text=String(value||'').trim().replace(/\s+/g,' ');
  const limit=Math.max(1,Number(maxLength)||120);
  return text.length<=limit?text:text.slice(0,limit).trimEnd()+'…';
}
function enhanceCompactTeamPost(card){
  if(!card||card.dataset.compactReady==='true'||!card.dataset.postId)return;
  card.dataset.compactReady='true';
  card.classList.add('team-post-collapsible');
  card.setAttribute('tabindex','0');
  card.setAttribute('role','button');
  card.setAttribute('aria-expanded','false');
  const author=card.querySelector('.post-header strong');
  if(author&&author.textContent.trim()==='Ledare')author.textContent='Ledarinlägg';
  const body=card.querySelector('h3 + p, .team-post-image + h3 + p, p');
  if(body){body.classList.add('team-post-preview');body.dataset.preview=teamPostPreview(body.textContent,120);}
  if(!card.querySelector('[data-action="toggle"]')){
    const toggle=document.createElement('button');
    toggle.type='button';toggle.className='team-post-toggle';toggle.dataset.action='toggle';toggle.textContent='VISA MER';
    const manage=card.querySelector('.team-post-manage');
    if(manage)card.insertBefore(toggle,manage);else card.appendChild(toggle);
  }
}
function toggleCompactTeamPost(card){
  if(!card)return;
  const expanded=card.classList.toggle('team-post-expanded');
  card.setAttribute('aria-expanded',String(expanded));
  const button=card.querySelector('[data-action="toggle"]');
  if(button)button.textContent=expanded?'VISA MINDRE':'VISA MER';
}
function enhanceCompactTeamPosts(root){
  const scope=root||document;
  scope.querySelectorAll('.team-post[data-post-id]').forEach(enhanceCompactTeamPost);
}
function startCompactTeamPosts(){
  const page=document.getElementById('teamPage');if(!page)return;
  const observer=new MutationObserver(()=>enhanceCompactTeamPosts(page));
  observer.observe(page,{childList:true,subtree:true});
  page.addEventListener('click',event=>{
    const card=event.target.closest&&event.target.closest('.team-post[data-post-id]');if(!card)return;
    if(event.target.closest('.team-post-manage'))return;
    if(event.target.closest('[data-action="toggle"]')){event.preventDefault();event.stopPropagation();toggleCompactTeamPost(card);return;}
    toggleCompactTeamPost(card);
  });
  page.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const card=event.target.closest&&event.target.closest('.team-post[data-post-id]');if(!card||event.target.closest('button'))return;
    event.preventDefault();toggleCompactTeamPost(card);
  });
  enhanceCompactTeamPosts(page);
}
const compactTeamPostApi={teamPostPreview,enhanceCompactTeamPost,toggleCompactTeamPost};
if(typeof module!=='undefined'&&module.exports)module.exports=compactTeamPostApi;
if(typeof window!=='undefined'){window.KronangCompactTeamPosts=compactTeamPostApi;if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCompactTeamPosts);else startCompactTeamPosts();}}
