(function(){
  const icons={
    goal:'<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"></path>',
    focus:'<path d="M4 19V9M10 19V5M16 19v-7M22 19V3"></path><path d="M2 19h22"></path>',
    'goal-history':'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    'focus-history':'<path d="M9 6h12M9 12h12M9 18h12"></path><circle cx="4" cy="6" r="1"></circle><circle cx="4" cy="12" r="1"></circle><circle cx="4" cy="18" r="1"></circle>'
  };
  const targets={developmentGoalSummary:'goal',developmentFocusSummary:'focus',developmentGoalHistory:'goal-history',developmentFocusHistory:'focus-history'};
  function decorate(){
    Object.keys(targets).forEach(function(id){
      const card=document.getElementById(id); if(!card||card.querySelector('.development-card-icon')) return;
      const icon=document.createElement('span');
      icon.className='development-card-icon';
      icon.dataset.developmentIcon=targets[id];
      icon.setAttribute('aria-hidden','true');
      icon.innerHTML='<svg viewBox="0 0 24 24" focusable="false">'+icons[targets[id]]+'</svg>';
      card.prepend(icon);
    });
  }
  const observer=new MutationObserver(decorate);
  function start(){decorate();observer.observe(document.getElementById('developmentPage')||document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
