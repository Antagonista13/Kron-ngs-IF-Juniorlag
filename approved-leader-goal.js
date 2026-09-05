(function(root){
function normalize(value){return String(value||'').trim().toLocaleLowerCase('sv-SE');}
function buildApprovedLeaderGoalPresentation(goal,proposals){
  const title=normalize(goal&&goal.title);
  const matched=Boolean(title)&&(proposals||[]).some(function(p){return p&&p.status==='accepted'&&normalize(p.proposed_goal_text)===title;});
  return matched?{approvedFromLeader:true,label:'GODKÄNT FRÅN DIN LEDARE',className:'approved-leader-goal'}:{approvedFromLeader:false,label:'',className:''};
}
async function refreshApprovedLeaderGoal(){
  if(!root||!root.kronangSupabase||typeof document==='undefined')return;
  const card=document.getElementById('developmentGoalSummary');
  if(!card||card.hidden)return;
  const heading=card.querySelector('h3');
  const goalTitle=card.querySelector('h2');
  if(!heading||!goalTitle)return;
  const db=root.kronangSupabase;
  const sessionResult=await db.auth.getSession();
  const user=sessionResult.data&&sessionResult.data.session&&sessionResult.data.session.user;
  if(!user)return;
  const playerResult=await db.from('players').select('id').eq('profile_id',user.id).maybeSingle();
  const player=playerResult.data;
  if(!player)return;
  const proposalResult=await db.from('development_goal_proposals').select('status,proposed_goal_text,resolved_at').eq('player_id',player.id).eq('status','accepted').order('resolved_at',{ascending:false}).limit(10);
  const view=buildApprovedLeaderGoalPresentation({title:goalTitle.textContent},proposalResult.data||[]);
  card.classList.toggle('approved-leader-goal',view.approvedFromLeader);
  const old=card.querySelector('.approved-leader-goal-label');if(old)old.remove();
  if(view.approvedFromLeader){const label=document.createElement('div');label.className='approved-leader-goal-label';label.textContent=view.label;card.insertBefore(label,heading);}
}
function schedule(){setTimeout(function(){refreshApprovedLeaderGoal().catch(function(err){console.error('Godkänt ledarmål:',err);});},120);}
if(typeof module!=='undefined'&&module.exports)module.exports={buildApprovedLeaderGoalPresentation};
if(root){root.KronangApprovedLeaderGoal={buildApprovedLeaderGoalPresentation,refreshApprovedLeaderGoal};root.addEventListener('kronang:development-updated',schedule);document.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('.nav-item[data-page="developmentPage"]'))schedule();});setTimeout(schedule,1100);}
})(typeof window!=='undefined'?window:null);
