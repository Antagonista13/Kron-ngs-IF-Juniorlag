function buildHomePlayerHeader(profile) {
  const item = profile || {};
  const number = item.player_number === null || item.player_number === undefined || item.player_number === '' ? '' : '#' + item.player_number;
  const team = item.team || 'Kronängs IF Juniorlag';
  const roleLabel = item.role === 'coach' || item.role === 'admin' ? 'Ledare' : '';
  return { name: item.full_name || 'Spelare', meta: team, playerNumber: roleLabel ? '' : number, roleLabel, avatarUrl: item.avatar_url || '' };
}

function mergeHomeProfileFields(base, numberRow, avatarRow) {
  const result = Object.assign({}, base || {});
  result.player_number = numberRow && numberRow.player_number !== undefined ? numberRow.player_number : '';
  result.avatar_url = avatarRow && avatarRow.avatar_url ? avatarRow.avatar_url : '';
  return result;
}

function buildNavIcon(type) {
  const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  const icons = {
    home: '<svg ' + common + '><path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.8v-6.2H9.3V21H3.5a.5.5 0 0 1-.5-.5z"/></svg>',
    calendar: '<svg ' + common + '><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
    development: '<svg ' + common + '><path d="M4 18 9 13l4 3 7-9"/><path d="M15 7h5v5"/></svg>',
    team: '<svg ' + common + '><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14 15c3.7-.7 6 1.2 6.5 5"/></svg>',
    profile: '<svg ' + common + '><circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/></svg>'
  };
  return icons[type] || '';
}

function getHomeShortcutPage(type) {
  const targets = { activity: 'calendarPage', challenge: 'developmentPage', news: 'teamPage', profile: 'profilePage' };
  return targets[type] || '';
}
function isHomeActivationKey(key) { return key === 'Enter' || key === ' '; }

function activateHomeShortcut(element, type) {
  if (!element || element.dataset.shortcutReady) return;
  element.dataset.shortcutReady = 'true';
  element.addEventListener('click', function (event) {
    if (type === 'challenge' && event.target && event.target.closest && event.target.closest('#challengeButton')) return;
    const target = getHomeShortcutPage(type);
    const nav = document.querySelector('.nav-item[data-page="' + target + '"]');
    if (nav) nav.click();
  });
  element.addEventListener('keydown', function (event) {
    if (!isHomeActivationKey(event.key)) return;
    if (event.target !== element) return;
    event.preventDefault();
    element.click();
  });
}

function setupHomePlayerHeader() {
  const homePage = document.getElementById('homePage');
  if (!homePage || !window.kronangSupabase) return;
  let header = document.getElementById('homePlayerHeader');
  if (!header) {
    header = document.createElement('section'); header.id = 'homePlayerHeader'; header.className = 'home-player-header';
    const welcome = homePage.querySelector('.welcome'); if (welcome) welcome.replaceWith(header); else homePage.prepend(header);
  }
  document.querySelectorAll('.nav-item').forEach(function (button) {
    const map = { homePage:'home', calendarPage:'calendar', developmentPage:'development', teamPage:'team', profilePage:'profile' };
    const span = button.querySelector('span'), page = button.getAttribute('data-page');
    if (span && map[page]) span.innerHTML = buildNavIcon(map[page]);
  });
  homePage.querySelectorAll('[data-home-icon]').forEach(function (icon) {
    icon.innerHTML = buildNavIcon(icon.getAttribute('data-home-icon'));
  });
  activateHomeShortcut(document.getElementById('homeNextActivityCard'), 'activity');
  activateHomeShortcut(document.getElementById('homeChallengeCard'), 'challenge');
  activateHomeShortcut(document.getElementById('homeNewsCard'), 'news');

  function render(model) {
    header.innerHTML = '';
    const text = document.createElement('div'); text.className = 'home-player-copy';
    const eyebrow = document.createElement('span'); eyebrow.className = 'home-player-eyebrow'; eyebrow.textContent = 'VÄLKOMMEN TILLBAKA';
    const name = document.createElement('h2'); name.textContent = model.name;
    const meta = document.createElement('p'); meta.textContent = model.meta;
    text.append(eyebrow, name, meta);
    const avatar = document.createElement('button'); avatar.type = 'button'; avatar.className = 'home-player-avatar'; avatar.setAttribute('aria-label','Öppna profil');
    if (model.avatarUrl) { const img=document.createElement('img'); img.src=model.avatarUrl; img.alt='Profilbild för '+model.name; avatar.appendChild(img); }
    else { avatar.innerHTML=buildNavIcon('profile'); avatar.setAttribute('title','Ingen profilbild vald'); }
    if (model.playerNumber) { const number=document.createElement('span'); number.className='home-player-number'; number.textContent=model.playerNumber; avatar.appendChild(number); }
    if (model.roleLabel) { const role=document.createElement('span'); role.className='home-player-role-label'; role.textContent=model.roleLabel; avatar.appendChild(role); }
    avatar.addEventListener('click',function(){ const nav=document.querySelector('.nav-item[data-page="profilePage"]'); if(nav) nav.click(); });
    header.append(text,avatar);
  }
  async function load() {
    const {data:sessionData}=await window.kronangSupabase.auth.getSession();
    const user=sessionData.session?sessionData.session.user:null;
    if(!user)return;

    const baseResult=await window.kronangSupabase.from('profiles').select('full_name, team, role').eq('id',user.id).maybeSingle();
    if(!baseResult.data)return;

    const numberResult=await window.kronangSupabase.from('profiles').select('player_number').eq('id',user.id).maybeSingle();
    const avatarResult=await window.kronangSupabase.from('profiles').select('avatar_url').eq('id',user.id).maybeSingle();
    const merged=mergeHomeProfileFields(baseResult.data, numberResult.error ? null : numberResult.data, avatarResult.error ? null : avatarResult.data);
    render(buildHomePlayerHeader(merged));
  }
  document.addEventListener('kronang:auth-signed-in',load); load();
}
function waitForHomePlayerHeader(){ if(window.kronangSupabase){setupHomePlayerHeader();return;} setTimeout(waitForHomePlayerHeader,100); }
if(typeof module!=='undefined'&&module.exports)module.exports={buildHomePlayerHeader,mergeHomeProfileFields,buildNavIcon,getHomeShortcutPage,isHomeActivationKey};
if(typeof window!=='undefined'&&typeof document!=='undefined')waitForHomePlayerHeader();
