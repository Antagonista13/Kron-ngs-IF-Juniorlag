(function(root){
function setupPlayerDevelopmentLayout(){
  if(typeof document==='undefined')return;
  const page=document.getElementById('developmentPage');
  const grid=page&&page.querySelector('.development-grid');
  if(!page||!grid)return;
  page.classList.add('player-development-compact');

  let journey=document.getElementById('playerDevelopmentJourney');
  if(!journey){journey=document.createElement('div');journey.id='playerDevelopmentJourney';journey.className='player-development-journey';grid.parentElement.insertBefore(journey,grid);}
  function slot(id){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;}return el;}
  const goalSlot=slot('playerMainGoalSlot');
  const focusSlot=slot('playerFocusSlot');
  const assessmentSlot=slot('playerAssessmentSlot');
  const trendSlot=slot('playerTrendSlot');
  const historySlot=slot('playerHistorySlot');
  [goalSlot,focusSlot,assessmentSlot,trendSlot,historySlot].forEach(el=>journey.appendChild(el));

  if(!document.getElementById('playerAssessmentHeading')){
    const heading=document.createElement('div');heading.id='playerAssessmentHeading';heading.className='player-development-section-heading';heading.innerHTML='<span>SJÄLVSKATTNING</span><p>Hur tycker du att det går just nu?</p>';assessmentSlot.appendChild(heading);
  }
  if(grid.parentElement!==assessmentSlot)assessmentSlot.appendChild(grid);

  let activeHistory='goal';
  function historyTarget(kind){
    const ids={goal:'developmentGoalHistory',focus:'developmentFocusHistory',development:'developmentHistory'};
    const alt={development:'profileDevelopmentHistory'};
    return document.getElementById(ids[kind])||document.getElementById(alt[kind]||'');
  }
  function showHistory(kind){
    activeHistory=kind;
    const content=document.getElementById('playerHistoryContent');if(!content)return;
    ['goal','focus','development'].forEach(name=>{const el=historyTarget(name);if(el){el.dataset.unifiedHistoryItem='true';el.hidden=name!==activeHistory;if(el.parentElement!==content)content.appendChild(el);}});
    document.querySelectorAll('#playerUnifiedHistory [data-history-panel]').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.historyPanel===activeHistory)));
  }
  function ensureHistory(){
    let card=document.getElementById('playerUnifiedHistory');
    if(!card){
      card=document.createElement('section');card.id='playerUnifiedHistory';card.className='card player-unified-history';
      card.innerHTML='<h2>HISTORIK</h2><div class="player-history-tabs" role="tablist"><button type="button" data-history-panel="goal">Målhistorik</button><button type="button" data-history-panel="focus">Fokushistorik</button><button type="button" data-history-panel="development">Utvecklingshistorik</button></div><div id="playerHistoryContent"></div>';
      historySlot.appendChild(card);
      card.querySelectorAll('[data-history-panel]').forEach(btn=>btn.addEventListener('click',()=>showHistory(btn.dataset.historyPanel)));
    }
    return card;
  }
  function moveExisting(){
    const goal=document.getElementById('playerMainGoalCard');const focus=document.getElementById('developmentFocusSummary');const trend=document.getElementById('developmentTrendCard')||document.getElementById('profileDevelopmentTrend');
    if(goal&&goal.parentElement!==goalSlot)goalSlot.appendChild(goal);if(focus&&focus.parentElement!==focusSlot)focusSlot.appendChild(focus);if(trend&&trend.parentElement!==trendSlot)trendSlot.appendChild(trend);
    ensureHistory();showHistory(activeHistory);
  }
  moveExisting();
  const observer=new MutationObserver(moveExisting);observer.observe(page,{childList:true,subtree:true});
}
if(typeof module!=='undefined'&&module.exports)module.exports={setupPlayerDevelopmentLayout};
if(root){root.KronangPlayerDevelopmentLayout={setupPlayerDevelopmentLayout};setTimeout(setupPlayerDevelopmentLayout,0);root.addEventListener('kronang:development-updated',setupPlayerDevelopmentLayout);}
})(typeof window!=='undefined'?window:null);
