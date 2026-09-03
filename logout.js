function getAccountCardPlacement(){return "last";}
function setupKronangLogout(){
 const profilePage=document.getElementById("profilePage");if(!profilePage)return;
 let logoutSection=profilePage.querySelector(".logout-card");if(!logoutSection){logoutSection=document.createElement("section");logoutSection.className="card logout-card";logoutSection.innerHTML=`<h3>Mitt konto</h3><p id="loggedInPlayer">Spelarprofil hämtas...</p><p id="loggedInEmail">Inloggning hämtas...</p><p>Logga ut från juniorlagsappen på den här enheten.</p><button id="logoutButton" type="button">LOGGA UT</button>`;}
 function keepAccountLast(){if(profilePage.lastElementChild!==logoutSection)profilePage.appendChild(logoutSection);}
 keepAccountLast();
 const logoutButton=document.getElementById("logoutButton"),loggedInPlayer=document.getElementById("loggedInPlayer"),loggedInEmail=document.getElementById("loggedInEmail");
 async function refreshAccount(){keepAccountLast();logoutButton.disabled=false;logoutButton.textContent="LOGGA UT";const{data}=await window.kronangSupabase.auth.getSession();if(!data.session||!data.session.user){loggedInPlayer.textContent="Ingen aktiv spelarprofil.";loggedInEmail.textContent="Ingen aktiv inloggning.";return;}const user=data.session.user;loggedInEmail.textContent=user.email?"Inloggad som: "+user.email:"Inloggning aktiv.";const{data:profile,error}=await window.kronangSupabase.from("profiles").select("full_name, role, team").eq("id",user.id).single();if(error){console.error("Profilfel:",error);loggedInPlayer.textContent="Spelarprofil kunde inte hämtas.";return;}if(profile)loggedInPlayer.textContent=(profile.role==="coach"?"Tränare: ":"Spelare: ")+profile.full_name;keepAccountLast();}
 function resetAccount(){keepAccountLast();logoutButton.disabled=true;logoutButton.textContent="UTLOGGAD";loggedInPlayer.textContent="Ingen aktiv spelarprofil.";loggedInEmail.textContent="Ingen aktiv inloggning.";}
 logoutButton.addEventListener("click",async function(){logoutButton.disabled=true;logoutButton.textContent="LOGGAR UT...";const{error}=await window.kronangSupabase.auth.signOut();if(error){console.error("Utloggningsfel:",error);logoutButton.disabled=false;logoutButton.textContent="LOGGA UT";return;}resetAccount();});
 document.addEventListener("kronang:auth-signed-in",refreshAccount);document.addEventListener("kronang:auth-signed-out",resetAccount);refreshAccount();
}
function waitForKronangSupabase(){if(window.kronangSupabase){setupKronangLogout();return;}setTimeout(waitForKronangSupabase,100);}
if(typeof module!=="undefined"&&module.exports)module.exports={getAccountCardPlacement};
if(typeof window!=="undefined"&&typeof document!=="undefined")waitForKronangSupabase();
