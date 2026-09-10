(function(root){
  function currentRole(){return document.body&&document.body.dataset?document.body.dataset.accessRole:'';}
  function removeLegacyAdminDevelopment(){
    const page=document.getElementById('developmentPage');
    if(!page)return;
    const journey=document.getElementById('playerDevelopmentJourney');if(journey)journey.hidden=true;
    const grid=page.querySelector('.development-grid');if(grid)grid.hidden=true;
    ['coachDevelopmentOverview','coachTeamOverview'].forEach(function(id){const node=document.getElementById(id);if(node)node.remove();});
    const legacySearch=document.getElementById('coachRosterSearch');
    if(legacySearch){const wrapper=legacySearch.closest('.coach-roster-search');if(wrapper&&!wrapper.closest('#developmentWorklist'))wrapper.remove();}
  }
  function ensureAdminDevelopmentHost(){
    const page=document.getElementById('developmentPage');
    if(!page)return null;
    let view=document.getElementById('coachDevelopmentView');
    if(!view){
      view=document.createElement('section');
      view.id='coachDevelopmentView';
      view.className='card';
      view.innerHTML='<h2>Spelare</h2><p>Sök eller filtrera laget och öppna en spelares utvecklingsprofil.</p>';
      page.appendChild(view);
    }
    if(!document.getElementById('developmentWorklist')&&!document.getElementById('coachPlayerList')){
      const list=document.createElement('div');
      list.id='coachPlayerList';
      list.innerHTML='<p>Spelare hämtas...</p>';
      view.appendChild(list);
    }
    if(!document.getElementById('coachPlayerDevelopment')){
      const detail=document.createElement('div');
      detail.id='coachPlayerDevelopment';
      view.appendChild(detail);
    }
    return view;
  }
  function ensureAdminPlayerCardEditModule(){
    if(root.KronangAdminPlayerCardEdit||document.querySelector('script[data-admin-player-card-edit]'))return;
    const script=document.createElement('script');
    script.src='admin-player-card-edit.js?v=2';
    script.defer=true;
    script.dataset.adminPlayerCardEdit='true';
    document.head.appendChild(script);
  }
  async function syncAdminDevelopment(){
    const role=currentRole();
    if(role!=='admin')return;
    removeLegacyAdminDevelopment();
    ensureAdminDevelopmentHost();
    ensureAdminPlayerCardEditModule();
    if(root.KronangCoachDevelopmentWorklist&&typeof root.KronangCoachDevelopmentWorklist.setup==='function')await root.KronangCoachDevelopmentWorklist.setup();
    removeLegacyAdminDevelopment();
    const page=document.getElementById('developmentPage');
    if(page)page.classList.add('admin-development-matches-coach');
  }
  function schedule(){setTimeout(function(){syncAdminDevelopment().catch(function(error){console.error('Admin utveckling:',error);});},50);}
  if(typeof document!=='undefined'){
    document.addEventListener('kronang:access-state',function(event){if(event.detail&&event.detail.role==='admin')schedule();});
    document.addEventListener('click',function(event){const button=event.target.closest('.nav-item[data-page="developmentPage"]');if(button&&currentRole()==='admin')schedule();});
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  }
})(typeof window!=='undefined'?window:{});
