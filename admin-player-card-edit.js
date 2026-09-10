function canEditPlayerFromPublicCard(role){return role==='admin';}

(function(root){
  let selectedRosterCard=null;

  function currentRole(){
    return document.body&&document.body.dataset?document.body.dataset.accessRole:'';
  }

  function findRosterEditButton(card){
    if(!card||!card.querySelectorAll)return null;
    return Array.from(card.querySelectorAll('.player-roster-card-actions button')).find(function(button){
      return button.textContent.trim()==='Redigera';
    })||null;
  }

  function injectAdminPlayerEditAction(){
    if(typeof document==='undefined'||!canEditPlayerFromPublicCard(currentRole()))return;
    const profile=document.querySelector('.player-public-profile');
    if(!profile||profile.querySelector('.player-public-profile-edit'))return;
    if(!selectedRosterCard||!selectedRosterCard.isConnected)return;
    const rosterEdit=findRosterEditButton(selectedRosterCard);
    if(!rosterEdit)return;

    const button=document.createElement('button');
    button.type='button';
    button.className='player-public-profile-edit';
    button.textContent='Redigera spelare';
    button.style.display='block';
    button.style.margin='14px auto 0';
    button.style.padding='9px 16px';
    button.style.border='1px solid #d6b65f';
    button.style.borderRadius='999px';
    button.style.background='transparent';
    button.style.color='#f4d97e';
    button.style.fontWeight='800';
    button.onclick=function(){
      if(!rosterEdit.isConnected)return;
      const back=profile.querySelector('.player-public-profile-back');
      if(back)back.click();
      setTimeout(function(){
        if(!rosterEdit.isConnected)return;
        rosterEdit.click();
        setTimeout(function(){
          const form=document.querySelector('#playerRosterSection .player-roster-form');
          if(!form||form.hidden)return;
          form.scrollIntoView({behavior:'auto',block:'start'});
          const name=form.elements&&form.elements.full_name;
          if(name)name.focus({preventScroll:true});
        },0);
      },80);
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

  if(root)root.KronangAdminPlayerCardEdit={canEditPlayerFromPublicCard:canEditPlayerFromPublicCard};
  if(typeof document!=='undefined')setup();
})(typeof window!=='undefined'?window:null);

if(typeof module!=='undefined'&&module.exports)module.exports={canEditPlayerFromPublicCard};
