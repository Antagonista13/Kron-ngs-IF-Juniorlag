(function(root){
function setupPlayerDevelopmentLayout(){
  if(typeof document==='undefined')return;
  const page=document.getElementById('developmentPage');
  const grid=page&&page.querySelector('.development-grid');
  if(!page||!grid)return;

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

  if(grid.parentElement!==assessmentSlot)assessmentSlot.appendChild(grid);

  function moveExisting(){
    const goal=document.getElementById('playerMainGoalCard');
    const focus=document.getElementById('developmentFocusSummary');
    const focusHistory=document.getElementById('developmentFocusHistory');
    const trend=document.getElementById('developmentTrendCard')||document.getElementById('profileDevelopmentTrend');
    const goalHistory=document.getElementById('developmentGoalHistory');
    const developmentHistory=document.getElementById('developmentHistory')||document.getElementById('profileDevelopmentHistory');
    if(goal&&goal.parentElement!==goalSlot)goalSlot.appendChild(goal);
    if(focus&&focus.parentElement!==focusSlot)focusSlot.appendChild(focus);
    if(trend&&trend.parentElement!==trendSlot)trendSlot.appendChild(trend);
    [goalHistory,focusHistory,developmentHistory].forEach(el=>{if(el&&el.parentElement!==historySlot)historySlot.appendChild(el);});
  }
  moveExisting();
  const observer=new MutationObserver(moveExisting);
  observer.observe(page,{childList:true,subtree:true});
}
if(typeof module!=='undefined'&&module.exports)module.exports={setupPlayerDevelopmentLayout};
if(root){root.KronangPlayerDevelopmentLayout={setupPlayerDevelopmentLayout};setTimeout(setupPlayerDevelopmentLayout,0);root.addEventListener('kronang:development-updated',setupPlayerDevelopmentLayout);}
})(typeof window!=='undefined'?window:null);
