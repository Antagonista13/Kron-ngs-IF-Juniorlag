function handleTeamPostNavigation(pageId,targetDocument){
  if(pageId==='teamPage')return false;
  const doc=targetDocument||(typeof document!=='undefined'?document:null);
  if(!doc||typeof doc.getElementById!=='function')return false;
  const composer=doc.getElementById('teamPostComposer');
  if(!composer)return false;
  composer.dataset.currentImageUrl='';
  const title=composer.querySelector('#teamPostTitle');if(title)title.value='';
  const body=composer.querySelector('#teamPostBody');if(body)body.value='';
  const pinned=composer.querySelector('#teamPostPinned');if(pinned)pinned.checked=false;
  const image=composer.querySelector('#teamPostImage');if(image)image.value='';
  const preview=composer.querySelector('#teamPostImagePreview');if(preview)preview.innerHTML='';
  const save=composer.querySelector('#saveTeamPost');if(save)save.textContent='PUBLICERA';
  const message=composer.querySelector('#teamPostMessage');if(message)message.textContent='';
  const form=composer.querySelector('#teamPostForm');if(form)form.hidden=true;
  return true;
}

function dispatchTeamPageOpened(doc){
  if(!doc||typeof doc.dispatchEvent!=='function')return false;
  const EventCtor=typeof CustomEvent==='function'?CustomEvent:null;
  if(!EventCtor)return false;
  doc.dispatchEvent(new EventCtor('kronang:team-page-opened'));
  return true;
}

function attachTeamPostNavigationReset(targetDocument){
  const doc=targetDocument||(typeof document!=='undefined'?document:null);
  if(!doc||typeof doc.addEventListener!=='function')return false;
  doc.addEventListener('click',function(event){
    const target=event&&event.target;
    const nav=target&&typeof target.closest==='function'?target.closest('.nav-item[data-page]'):null;
    if(!nav||!nav.dataset)return;
    if(nav.dataset.page==='teamPage')dispatchTeamPageOpened(doc);
    else handleTeamPostNavigation(nav.dataset.page,doc);
  });
  return true;
}

if(typeof module!=='undefined'&&module.exports)module.exports={handleTeamPostNavigation,attachTeamPostNavigationReset,dispatchTeamPageOpened};
if(typeof window!=='undefined'&&typeof document!=='undefined')attachTeamPostNavigationReset(document);
