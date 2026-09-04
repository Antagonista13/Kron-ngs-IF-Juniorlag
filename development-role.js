function isLeaderRoleLocal(role){if(typeof window!=="undefined"&&window.KronangPermissions)return window.KronangPermissions.isLeaderRole(role);return role==="coach"||role==="admin";}
function canEditSelfAssessment(role){return role==="player";}
function shouldShowPlayerDevelopmentCards(role){return role==="player";}
function getDevelopmentHeading(role,fullName){if(isLeaderRoleLocal(role))return{title:"Juniorlagets utveckling",subtitle:"Följ spelarnas mål, fokus och utveckling över tid."};return{title:fullName?"Din utveckling, "+fullName:"Din utveckling",subtitle:"Träna smart. Utvecklas varje dag."};}
if(typeof module!=="undefined"&&module.exports)module.exports={canEditSelfAssessment,shouldShowPlayerDevelopmentCards,getDevelopmentHeading};
if(typeof window!=="undefined"){
  window.canEditSelfAssessment=canEditSelfAssessment;window.shouldShowPlayerDevelopmentCards=shouldShowPlayerDevelopmentCards;window.getDevelopmentHeading=getDevelopmentHeading;
  if(!document.querySelector('script[data-development-card-icons]')){const script=document.createElement('script');script.src='development-card-icons.js?v=1';script.dataset.developmentCardIcons='true';document.head.appendChild(script);}
}
