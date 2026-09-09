(function(root){
  async function refreshSportAdminBadge(){
    if(!root.kronangSupabase)return;
    const badge=document.getElementById('adminPendingBadge');
    if(!badge)return;
    const {count,error}=await root.kronangSupabase
      .from('sportadmin_player_candidates')
      .select('id',{count:'exact',head:true})
      .eq('status','pending');
    if(error)return;
    const pending=count||0;
    badge.textContent=String(pending);
    badge.hidden=!pending;
    badge.setAttribute('aria-label',pending?pending+' nya SportAdmin-spelare väntar':'Inga nya SportAdmin-spelare väntar');
  }
  document.addEventListener('kronang:auth-signed-in',()=>setTimeout(refreshSportAdminBadge,150));
  document.addEventListener('click',e=>{
    if(e.target&&e.target.closest&&e.target.closest('[data-page="profilePage"],#openAdminPage,[data-sportadmin-sync],[data-action]'))setTimeout(refreshSportAdminBadge,180);
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshSportAdminBadge,180));else setTimeout(refreshSportAdminBadge,180);
  root.KronangSportAdminBadge={refresh:refreshSportAdminBadge};
})(typeof window!=='undefined'?window:globalThis);
