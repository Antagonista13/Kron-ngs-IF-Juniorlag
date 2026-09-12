function clearLoginPassword(passwordInput) {
  if (passwordInput) passwordInput.value = '';
}
function loadPlayerOnboardingEarly(){
  if(typeof document==='undefined'||document.querySelector('script[src="player-onboarding.js?v=1"]'))return;
  if(document.readyState==='loading'){
    document.write('<script src="player-onboarding.js?v=1"><\/script>');
    return;
  }
  const script=document.createElement('script');script.src='player-onboarding.js?v=1';document.head.appendChild(script);
}
function loadKronangSecurityAddons(){
  if(typeof document==='undefined')return;
  ['auth-invite-only.js?v=1','admin-sportadmin-badge.js?v=1','player-onboarding-invite.js?v=1'].forEach(src=>{
    if(document.querySelector('script[src="'+src+'"]'))return;
    const script=document.createElement('script');
    script.src=src;
    document.head.appendChild(script);
  });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { clearLoginPassword, loadPlayerOnboardingEarly };
if (typeof window !== 'undefined') {
  window.clearKronangLoginPassword = clearLoginPassword;
  loadPlayerOnboardingEarly();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadKronangSecurityAddons,250));
  else setTimeout(loadKronangSecurityAddons,250);
}
