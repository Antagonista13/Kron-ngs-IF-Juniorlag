(function(root){
let activeHistoryKind='goal';

function ensureCompactStyles(){
  if(typeof document==='undefined'||document.getElementById('playerDevelopmentCompactStyles'))return;
  const style=document.createElement('style');
  style.id='playerDevelopmentCompactStyles';
  style.textContent=`
    #developmentPage .player-development-journey{display:flex;flex-direction:column;gap:10px}
    #developmentPage .player-development-journey .card{margin-bottom:0;border-radius:16px;padding:15px}
    #developmentPage .player-development-section-heading{margin:2px 2px 8px}
    #developmentPage .player-development-section-heading span{display:block;font-size:12px;font-weight:900;letter-spacing:1.2px}
    #developmentPage .player-development-section-heading p{margin:3px 0 0;color:#6f6f6f;font-size:13px}
    #developmentPage #playerAssessmentSlot .development-grid{grid-template-columns:1fr 1fr;gap:8px}
    #developmentPage #playerAssessmentSlot .development-card{border-radius:14px;padding:12px;min-height:0}
    #developmentPage #playerAssessmentSlot .development-icon{font-size:21px;margin-bottom:6px}
    #developmentPage #playerAssessmentSlot .development-card h3{font-size:16px;margin:0 0 7px}
    #developmentPage #playerAssessmentSlot .development-card p{font-size:12px;line-height:1.3;margin-bottom:4px}
    #developmentPage #playerAssessmentSlot .self-rating-stars{gap:2px;margin-bottom:8px}
    #developmentPage #playerAssessmentSlot .rating-star{font-size:23px}
    #developmentPage #playerAssessmentSlot .self-reflection{min-height:52px;margin-bottom:8px;padding:8px;font-size:13px}
    #developmentPage #playerAssessmentSlot .development-save-card{grid-column:1/-1;padding:10px}
    #developmentPage #playerAssessmentSlot #saveDevelopmentButton{padding:11px 14px;border-radius:11px;font-size:13px}
    #developmentPage .player-unified-history h2{margin:0 0 10px;font-size:18px}
    #developmentPage .player-history-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
    #developmentPage .player-history-tabs button{border:1px solid #d9d9d9;background:#f4f4f4;color:#222;border-radius:10px;padding:9px 6px;font-size:11px;font-weight:800;line-height:1.15;cursor:pointer}
    #developmentPage .player-history-tabs button[aria-selected="true"]{background:#111;color:#fff;border-color:#111}
    #developmentPage #playerHistoryContent .card{box-shadow:none;border:1px solid #ececec;padding:12px}
    @media (max-width:420px){
      #developmentPage .page-heading{margin-bottom:14px}
      #developmentPage .page-heading h2{font-size:24px}
      #developmentPage .player-development-journey{gap:8px}
      #developmentPage .player-development-journey .card{padding:13px}
      #developmentPage #playerAssessmentSlot .development-card{padding:10px}
      #developmentPage .player-history-tabs button{padding:8px 4px;font-size:10px}
    }
  `;
  document.head.appendChild(style);
}

function setupPlayerDevelopmentLayout(){
  if(typeof document==='undefined')return;
  const page=document.getElementById('developmentPage');
  const grid=page&&page.querySelector('.development-grid');
  if(!page||!grid)return;
  ensureCompactStyles();

  let journey=document.getElementById('playerDevelopmentJourney');
  if(!journey){
    journey=document.createElement('div');
    journey.id='playerDevelopmentJourney';
    journey.className='player-development-journey';
    grid.parentElement.insertBefore(journey,grid);
  }
  function slot(id){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;}return el;}
  const goalSlot=slot('playerMainGoalSlot');
  const focusSlot=slot('playerFocusSlot');
  const assessmentSlot=slot('playerAssessmentSlot');
  const trendSlot=slot('playerTrendSlot');
  const historySlot=slot('playerHistorySlot');
  [goalSlot,focusSlot,assessmentSlot,trendSlot,historySlot].forEach(el=>journey.appendChild(el));

  if(!document.getElementById('playerAssessmentHeading')){
    const heading=document.createElement('div');
    heading.id='playerAssessmentHeading';
    heading.className='player-development-section-heading';
    heading.innerHTML='<span>SJÄLVSKATTNING</span><p>Hur tycker du att det går just nu?</p>';
    assessmentSlot.appendChild(heading);
  }
  if(grid.parentElement!==assessmentSlot)assessmentSlot.appendChild(grid);

  function ensureHistory(){
    let card=document.getElementById('playerUnifiedHistory');
    if(!card){
      card=document.createElement('section');
      card.id='playerUnifiedHistory';
      card.className='card player-unified-history';
      card.innerHTML='<h2>HISTORIK</h2><div class="player-history-tabs" role="tablist"><button type="button" data-history-panel="goal">Målhistorik</button><button type="button" data-history-panel="focus">Fokushistorik</button><button type="button" data-history-panel="development">Utvecklingshistorik</button></div><div id="playerHistoryContent"></div>';
      historySlot.appendChild(card);
      card.querySelectorAll('[data-history-panel]').forEach(btn=>btn.addEventListener('click',()=>showHistory(btn.dataset.historyPanel)));
    }
    return card;
  }
  function showHistory(kind){
    activeHistoryKind=kind;
    const content=document.getElementById('playerHistoryContent');
    if(!content)return;
    const ids={goal:'developmentGoalHistory',focus:'developmentFocusHistory',development:'developmentHistory'};
    const alt={development:'profileDevelopmentHistory'};
    const target=document.getElementById(ids[kind])||document.getElementById(alt[kind]||'');
    content.querySelectorAll('[data-unified-history-item]').forEach(el=>el.hidden=true);
    if(target){
      target.hidden=false;
      target.dataset.unifiedHistoryItem='true';
      if(target.parentElement!==content)content.appendChild(target);
    }
    document.querySelectorAll('#playerUnifiedHistory [data-history-panel]').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.historyPanel===kind)));
  }

  function moveExisting(){
    const goal=document.getElementById('playerMainGoalCard');
    const focus=document.getElementById('developmentFocusSummary');
    const trend=document.getElementById('developmentTrendCard')||document.getElementById('profileDevelopmentTrend');
    if(goal&&goal.parentElement!==goalSlot)goalSlot.appendChild(goal);
    if(focus&&focus.parentElement!==focusSlot)focusSlot.appendChild(focus);
    if(trend&&trend.parentElement!==trendSlot)trendSlot.appendChild(trend);
    const card=ensureHistory();
    const content=card.querySelector('#playerHistoryContent');
    const histories=[document.getElementById('developmentGoalHistory'),document.getElementById('developmentFocusHistory'),document.getElementById('developmentHistory')||document.getElementById('profileDevelopmentHistory')].filter(Boolean);
    histories.forEach(el=>{
      el.dataset.unifiedHistoryItem='true';
      if(el.parentElement!==content)content.appendChild(el);
    });
    showHistory(activeHistoryKind);
  }
  moveExisting();
  const observer=new MutationObserver(moveExisting);
  observer.observe(page,{childList:true,subtree:true});
}
if(typeof module!=='undefined'&&module.exports)module.exports={setupPlayerDevelopmentLayout};
if(root){root.KronangPlayerDevelopmentLayout={setupPlayerDevelopmentLayout};setTimeout(setupPlayerDevelopmentLayout,0);root.addEventListener('kronang:development-updated',setupPlayerDevelopmentLayout);}
})(typeof window!=='undefined'?window:null);
