(function(root){
  function getToken(locationLike){
    const search=String(locationLike&&locationLike.search||'');
    return new URLSearchParams(search).get('onboard')||'';
  }
  function isActive(locationLike){return Boolean(getToken(locationLike));}
  function addStyles(){
    if(!root.document||document.getElementById('playerOnboardingStyles'))return;
    const style=document.createElement('style');style.id='playerOnboardingStyles';style.textContent='html[data-player-onboarding-active="true"] #loginScreen{display:none!important}.player-onboarding-screen{position:fixed;inset:0;z-index:100100;background:#080808;color:#111;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}.player-onboarding-box{width:100%;max-width:390px;background:#fff;border-radius:24px;padding:28px 22px;box-sizing:border-box}.player-onboarding-box h1{margin:0;text-align:center;font-size:24px}.player-onboarding-kicker{text-align:center;color:#9a7a45;font-size:11px;font-weight:850;letter-spacing:.16em}.player-onboarding-player{text-align:center;font-size:20px;font-weight:850;margin:12px 0 22px}.player-onboarding-form{display:grid;gap:10px}.player-onboarding-form label{font-size:12px;font-weight:800}.player-onboarding-form input{width:100%;box-sizing:border-box;min-height:48px;border:1px solid #ccc;border-radius:12px;padding:11px;font-size:16px}.player-onboarding-form button{min-height:50px;border:0;border-radius:12px;background:#080808;color:#fff;font-weight:850}.player-onboarding-message{text-align:center;min-height:20px;color:#8b0000;font-size:13px}.player-onboarding-message.success{color:#246b3b}';document.head.appendChild(style);
  }
  function buildScreen(){
    let screen=document.getElementById('playerOnboardingScreen');if(screen)return screen;
    screen=document.createElement('section');screen.id='playerOnboardingScreen';screen.className='player-onboarding-screen';screen.innerHTML='<div class="player-onboarding-box"><p class="player-onboarding-kicker">KRONÄNGS IF JUNIORLAG</p><h1>Aktivera ditt konto</h1><p class="player-onboarding-player" id="playerOnboardingName">Kontrollerar inbjudan…</p><form class="player-onboarding-form" id="playerOnboardingForm" hidden><label>E-post<input id="playerOnboardingEmail" type="email" autocomplete="email" required></label><label>Lösenord<input id="playerOnboardingPassword" type="password" autocomplete="new-password" minlength="6" required></label><label>Bekräfta lösenord<input id="playerOnboardingConfirm" type="password" autocomplete="new-password" minlength="6" required></label><button type="submit">AKTIVERA KONTO</button></form><p class="player-onboarding-message" id="playerOnboardingMessage" aria-live="polite"></p></div>';document.body.appendChild(screen);return screen;
  }
  async function start(client){
    const token=getToken(root.location);if(!token||!client||!root.document)return false;
    addStyles();document.documentElement.dataset.playerOnboardingActive='true';buildScreen();
    const name=document.getElementById('playerOnboardingName'),form=document.getElementById('playerOnboardingForm'),message=document.getElementById('playerOnboardingMessage');
    const validation=await client.functions.invoke('complete-player-onboarding',{body:{action:'validate',token:token}});
    if(validation.error||!validation.data||!validation.data.ok){name.textContent='Inbjudan kan inte användas';message.textContent=(validation.data&&validation.data.error)||'Länken är ogiltig, redan använd eller har gått ut.';return false;}
    name.textContent=validation.data.playerName||'Spelare';form.hidden=false;
    if(form.dataset.ready)return true;form.dataset.ready='1';
    form.addEventListener('submit',async function(event){
      event.preventDefault();const email=document.getElementById('playerOnboardingEmail').value.trim(),password=document.getElementById('playerOnboardingPassword').value,confirm=document.getElementById('playerOnboardingConfirm').value,button=form.querySelector('button');message.classList.remove('success');
      if(!email){message.textContent='Ange din e-postadress.';return;}if(password.length<6){message.textContent='Lösenordet måste vara minst 6 tecken.';return;}if(password!==confirm){message.textContent='Lösenorden matchar inte.';return;}
      button.disabled=true;button.textContent='AKTIVERAR…';message.textContent='';
      const result=await client.functions.invoke('complete-player-onboarding',{body:{action:'complete',token:token,email:email,password:password}});
      if(result.error||!result.data||!result.data.ok){button.disabled=false;button.textContent='AKTIVERA KONTO';message.textContent=(result.data&&result.data.error)||'Kontot kunde inte skapas. Försök igen.';return;}
      const signed=await client.auth.signInWithPassword({email:email,password:password});
      if(signed.error){button.disabled=false;button.textContent='LOGGA IN';message.textContent='Kontot är skapat. Öppna appen igen och logga in.';message.classList.add('success');return;}
      message.textContent='Klart! Du är nu ansluten till laget.';message.classList.add('success');
      const clean=root.location.origin+root.location.pathname;root.setTimeout(function(){root.location.replace(clean);},700);
    });
    return true;
  }
  function waitForClient(){if(!isActive(root.location)||!root.document)return;addStyles();document.documentElement.dataset.playerOnboardingActive='true';buildScreen();if(root.kronangSupabase)start(root.kronangSupabase);else root.setTimeout(waitForClient,50);}
  const api={getToken:getToken,isActive:isActive,start:start};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.document)waitForClient();root.KronangPlayerOnboarding=api;
})(typeof window!=='undefined'?window:globalThis);
