(function(root){
function leader(role){return role==='admin'||role==='coach';}
function canRegisterDevelopmentFollowUp(role){return leader(role);}
function canProposeDevelopmentGoal(role){return leader(role);}
function canEditOwnDevelopmentGoal(role,ownsPlayer){return role==='player'&&Boolean(ownsPlayer);}
function buildDevelopmentProfileModel(input){input=input||{};const role=input.role||'';const allowed=leader(role)||role==='player';if(!allowed)return{allowed:false,entries:[],canFollowUp:false,canPropose:false};let entries=input.entries||[];if(role==='player')entries=entries.filter(x=>x.visibility==='player_visible');return{allowed:true,player:input.player||null,goal:input.goal||null,focus:input.focus||null,proposal:input.proposal||null,entries:entries,canFollowUp:leader(role),canPropose:leader(role),canEditGoal:canEditOwnDevelopmentGoal(role,Boolean(input.ownsPlayer))};}
const profileApi={buildDevelopmentProfileModel,canRegisterDevelopmentFollowUp,canProposeDevelopmentGoal,canEditOwnDevelopmentGoal};if(typeof module!=='undefined'&&module.exports)module.exports=profileApi;if(root)root.KronangDevelopmentProfile=profileApi;
})(typeof window!=='undefined'?window:null);