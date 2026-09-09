function clearLoginPassword(passwordInput) {
  if (passwordInput) passwordInput.value = '';
}
function loadKronangSecurityAddons(){
  if(typeof document==='undefined')return;
  ['auth-invite-only.js?v=1','admin-sportadmin-badge.js?v=1'].forEach(src=>{
    if(document.querySelector('script[src="'+src+'"]'))return;
    const script=document.createElement('script');
    script.src=src;
    document.head.appendChild(script);
  });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { clearLoginPassword };
if (typeof window !== 'undefined') {
  window.clearKronangLoginPassword = clearLoginPassword;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadKronangSecurityAddons,250));
  else setTimeout(loadKronangSecurityAddons,250);
}
