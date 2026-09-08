(function(root){
function revealHistoryContent(target){
  if(!target)return;
  const toggle=Array.from(target.querySelectorAll('button')).find(function(button){
    return (button.textContent||'').trim().toUpperCase().startsWith('VISA ');
  });
  if(toggle)toggle.click();
}

function revealSelectedHistory(){
  if(typeof document==='undefined')return;
  const selected=document.querySelector('#playerUnifiedHistory [data-history-panel][aria-selected="true"]');
  if(!selected)return;
  const ids={goal:'developmentGoalHistory',focus:'developmentFocusHistory',development:'developmentHistory'};
  const alt={development:'profileDevelopmentHistory'};
  const kind=selected.dataset.historyPanel;
  const target=document.getElementById(ids[kind])||document.getElementById(alt[kind]||'');
  revealHistoryContent(target);
}

function setupDirectHistory(){
  if(typeof document==='undefined')return;
  const page=document.getElementById('developmentPage');
  if(!page)return;
  page.addEventListener('click',function(event){
    if(event.target&&event.target.closest&&event.target.closest('#playerUnifiedHistory [data-history-panel]'))setTimeout(revealSelectedHistory,0);
  });
  const observer=new MutationObserver(revealSelectedHistory);
  observer.observe(page,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-selected']});
  revealSelectedHistory();
}

if(typeof module!=='undefined'&&module.exports)module.exports={revealHistoryContent};
if(root){root.KronangPlayerHistoryDirect={revealHistoryContent:revealHistoryContent};setTimeout(setupDirectHistory,0);}
})(typeof window!=='undefined'?window:null);
