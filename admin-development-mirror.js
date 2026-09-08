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
  async function syncAdminDevelopment(){
    const role=currentRole();
    if(role!=='admin')return;
    removeLegacyAdminDevelopment();
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
