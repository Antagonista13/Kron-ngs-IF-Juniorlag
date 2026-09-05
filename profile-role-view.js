function profileRolePresentation(role) {
  const isParent = role === 'parent';
  const isLeader = role === 'coach' || role === 'admin';
  return {
    showPlayerDevelopment: role === 'player',
    showLeaderProfile: isLeader,
    showParentInfo: isParent,
    showAdminStatus: role === 'admin',
    roleLabel: role === 'admin' ? 'Admin' : role === 'coach' ? 'Ledare' : '',
    subtitle: isLeader ? 'Din ledarprofil och dina verktyg.' : isParent ? 'Här hittar du information kopplad till ditt konto.' : 'Din utveckling börjar med dig.'
  };
}
function leaderSnapshotPresentation(playerCount,nextActivityText){
  const activity=String(nextActivityText||'').trim();
  return {playerCount:playerCount==null?'–':String(playerCount),nextActivity:activity&&!/Hämtar/i.test(activity)?activity:'–'};
}
function currentLeaderRole(){return document.body&&document.body.dataset?document.body.dataset.accessRole:'';}
function refreshCurrentLeaderProfile(){const role=currentLeaderRole();if(role==='coach'||role==='admin')refreshLeaderProfile(role).catch(function(error){console.error('Ledarprofil:',error);});}
function openProfilePage(pageId) {
  document.querySelectorAll('.page').forEach(function(page){page.classList.toggle('active',page.id===pageId);});
  document.querySelectorAll('.nav-item').forEach(function(button){button.classList.toggle('active',button.dataset.page===pageId);});
  if(pageId==='profilePage')refreshCurrentLeaderProfile();
  if(pageId==='calendarPage'&&typeof window!=='undefined'&&typeof window.testSportAdminCalendar==='function')window.testSportAdminCalendar();
  if (typeof window!=='undefined'&&window.KronangNavigation&&typeof window.KronangNavigation.scrollPageTop==='function') window.KronangNavigation.scrollPageTop();
}
function ensureLeaderProfile() {
  const page=document.getElementById('profilePage'); if(!page)return null;
  let root=document.getElementById('leaderProfile'); if(root)return root;
  root=document.createElement('section'); root.id='leaderProfile'; root.className='leader-profile'; root.hidden=true;
  root.innerHTML='<section class="leader-profile-card"><p class="leader-profile-kicker">MIN ROLL</p><h3 class="leader-profile-role" id="leaderProfileRole"></h3><p>Ledare i Kronängs IF Juniorlag</p></section><section class="leader-profile-card"><h3>Mina snabblänkar</h3><div class="leader-profile-links"><button type="button" data-profile-page="teamPage">LAGET</button><button type="button" data-profile-page="developmentPage">UTVECKLING</button><button type="button" data-profile-page="calendarPage">KALENDER</button><button type="button" id="leaderAdminQuickLink">ADMINISTRATION</button></div></section><section class="leader-profile-card"><h3>Laget just nu</h3><div class="leader-profile-snapshot"><div><strong id="leaderPlayerCount">–</strong><span>Spelare</span></div><div id="leaderNextActivityTile" data-profile-page="calendarPage" role="button" tabindex="0" aria-label="Öppna nästa aktivitet i kalendern"><strong id="leaderNextActivity">–</strong><span>Nästa aktivitet</span></div></div></section><section class="leader-profile-card leader-admin-status" id="leaderAdminStatus" hidden><p class="leader-profile-kicker">ADMINISTRATION</p><h3 id="leaderPendingAccess">Allt är klart</h3><p id="leaderPendingAccessText">Inga konton väntar på åtkomst.</p></section>';
  page.appendChild(root);
  root.addEventListener('click',function(event){const pageButton=event.target.closest('[data-profile-page]');if(pageButton)openProfilePage(pageButton.dataset.profilePage);if(event.target.closest('#leaderAdminQuickLink')){const adminEntry=document.getElementById('openAdminPage');if(adminEntry)adminEntry.click();else openProfilePage('adminPage');}});
  root.addEventListener('keydown',function(event){const pageButton=event.target.closest('[data-profile-page]');if(pageButton&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openProfilePage(pageButton.dataset.profilePage);}});
  return root;
}
async function refreshLeaderProfile(role){
  if(typeof window==='undefined'||!window.kronangSupabase||!(role==='coach'||role==='admin'))return;
  const db=window.kronangSupabase;
  const players=await db.from('players').select('id',{count:'exact',head:true}).eq('is_active',true);
  const nextSource=document.querySelector('#nextActivityHome strong');
  const snapshot=leaderSnapshotPresentation(players.count,nextSource&&nextSource.textContent);
  const playerCount=document.getElementById('leaderPlayerCount');if(playerCount)playerCount.textContent=snapshot.playerCount;
  const next=document.getElementById('leaderNextActivity');if(next)next.textContent=snapshot.nextActivity;
  if(role==='admin'){
    const pending=await db.from('profiles').select('id',{count:'exact',head:true}).eq('role','pending');const count=pending.count||0;
    const title=document.getElementById('leaderPendingAccess');const text=document.getElementById('leaderPendingAccessText');
    if(title)title.textContent=count?count+' väntar på åtkomst':'Allt är klart';if(text)text.textContent=count?'Öppna Administration för att hantera kontona.':'Inga konton väntar på åtkomst.';
  }
}
function applyProfileRoleView(role) {
  if (typeof document === 'undefined') return;
  const view=profileRolePresentation(role);const leaderProfile=ensureLeaderProfile();
  document.querySelectorAll('[data-player-profile-section]').forEach(function(section){section.hidden=!view.showPlayerDevelopment;section.style.display=view.showPlayerDevelopment?'':'none';});
  const parentInfo=document.getElementById('parentProfileInfo');if(parentInfo){parentInfo.hidden=!view.showParentInfo;parentInfo.style.display=view.showParentInfo?'':'none';}
  if(leaderProfile){leaderProfile.hidden=!view.showLeaderProfile;leaderProfile.style.display=view.showLeaderProfile?'':'none';}
  const roleLabel=document.getElementById('leaderProfileRole');if(roleLabel)roleLabel.textContent=view.roleLabel;
  const adminStatus=document.getElementById('leaderAdminStatus');if(adminStatus){adminStatus.hidden=!view.showAdminStatus;adminStatus.style.display=view.showAdminStatus?'':'none';}
  const adminQuick=document.getElementById('leaderAdminQuickLink');if(adminQuick)adminQuick.style.display=view.showAdminStatus?'':'none';
  const subtitle=document.getElementById('profileSubtitle');if(subtitle)subtitle.textContent=view.subtitle;
  refreshLeaderProfile(role).catch(function(error){console.error('Ledarprofil:',error);});
}
if(typeof module!=='undefined'&&module.exports)module.exports={profileRolePresentation,leaderSnapshotPresentation,applyProfileRoleView};
if(typeof document!=='undefined'){
  if(!document.querySelector('link[data-leader-profile-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href='leader-profile.css?v=2';link.dataset.leaderProfileStyle='1';document.head.appendChild(link);}
  document.addEventListener('kronang:access-state',function(event){applyProfileRoleView(event.detail&&event.detail.role?event.detail.role:'pending');});
  document.addEventListener('kronang:next-activity-updated',refreshCurrentLeaderProfile);
  document.addEventListener('click',function(event){const button=event.target.closest('.nav-item[data-page="profilePage"]');if(button)refreshCurrentLeaderProfile();});
  const initialRole=currentLeaderRole();if(initialRole)applyProfileRoleView(initialRole);
}
