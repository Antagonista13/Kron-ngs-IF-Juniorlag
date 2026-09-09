(function(root){
  function applyInviteOnly(){
    const toggle=document.getElementById('authModeToggle');
    const nameField=document.getElementById('signupNameField');
    if(toggle){toggle.hidden=true;toggle.remove();}
    if(nameField)nameField.hidden=true;
    if(root.kronangSupabase&&root.kronangSupabase.auth){
      root.kronangSupabase.auth.signUp=async function(){
        return {data:{user:null,session:null},error:new Error('Endast inbjudna användare kan skapa konto.')};
      };
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyInviteOnly);else applyInviteOnly();
  setTimeout(applyInviteOnly,100);
})(typeof window!=='undefined'?window:globalThis);
