function permissionApi() {
  if (typeof window !== 'undefined' && window.KronangPermissions) return window.KronangPermissions;
  if (typeof require === 'function') return require('./role-permissions.js');
  return null;
}

function allowedPagesForRole(role) {
  const permissions = permissionApi();
  const normalized = permissions ? permissions.normalizeRole(role) : ['admin','coach','player','parent','pending'].includes(role) ? role : 'pending';
  const all = ['homePage','calendarPage','developmentPage','teamPage','profilePage'];
  if (normalized === 'admin' || normalized === 'coach' || normalized === 'player') return all.slice();
  if (normalized === 'parent') return ['homePage','calendarPage','teamPage','profilePage'];
  return [];
}

function buildAccessState(profile) {
  const item = profile || {};
  const permissions = permissionApi();
  const role = permissions ? permissions.normalizeRole(item.role) : ['admin','coach','player','parent','pending'].includes(item.role) ? item.role : 'pending';
  if (item.is_active === false) return { status: 'disabled', role, allowedPages: [] };
  if (role === 'pending') return { status: 'pending', role, allowedPages: [] };
  return { status: 'active', role, allowedPages: allowedPagesForRole(role) };
}

function removeAccessStatusScreen() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('accessStatusScreen');
  if (existing) existing.remove();
}

function renderAccessStatusScreen(state) {
  removeAccessStatusScreen();
  const screen = document.createElement('section');
  screen.id = 'accessStatusScreen';
  screen.className = 'access-status-screen';
  const isDisabled = state.status === 'disabled';
  screen.innerHTML = `<div class="access-status-card"><span>KRONÄNGS IF JUNIORLAG</span><h2>${isDisabled ? 'Kontot är avstängt' : 'Väntar på godkännande'}</h2><p>${isDisabled ? 'Din åtkomst är avstängd. Kontakta lagets administratör om du tror att detta är fel.' : 'Ditt konto är skapat. En administratör behöver godkänna det innan du får tillgång till lagets innehåll.'}</p><button type="button" id="accessStatusLogout">LOGGA UT</button></div>`;
  document.body.appendChild(screen);
  const logout = screen.querySelector('#accessStatusLogout');
  if (logout) logout.addEventListener('click', async function () {
    if (window.kronangSupabase) await window.kronangSupabase.auth.signOut();
  });
}

function applyAccessState(state) {
  if (typeof document === 'undefined') return;
  const allowed = new Set(state.allowedPages || []);
  document.querySelectorAll('.page').forEach(function (page) { page.hidden = !allowed.has(page.id); });
  document.querySelectorAll('.nav-item[data-page]').forEach(function (button) { button.hidden = !allowed.has(button.dataset.page); });
  document.body.classList.remove('access-resolving');
  document.body.classList.toggle('access-blocked', state.status !== 'active');
  if (state.status !== 'active') { renderAccessStatusScreen(state); return; }
  removeAccessStatusScreen();
  const activePage = document.querySelector('.page.active');
  if (!activePage || !allowed.has(activePage.id)) {
    document.querySelectorAll('.page').forEach(function (page) { page.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function (item) { item.classList.remove('active'); });
    const home = document.getElementById('homePage');
    const homeNav = document.querySelector('.nav-item[data-page="homePage"]');
    if (home && allowed.has('homePage')) home.classList.add('active');
    if (homeNav && allowed.has('homePage')) homeNav.classList.add('active');
  }
}

async function loadKronangAccessState() {
  if (!window.kronangSupabase) return;
  document.body.classList.add('access-resolving');
  const { data: sessionData } = await window.kronangSupabase.auth.getSession();
  const user = sessionData.session ? sessionData.session.user : null;
  if (!user) { document.body.classList.remove('access-resolving', 'access-blocked'); removeAccessStatusScreen(); return; }
  const { data: profile, error } = await window.kronangSupabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
  if (error || !profile) { applyAccessState(buildAccessState({ role: 'pending', is_active: true })); return; }
  applyAccessState(buildAccessState(profile));
}

function waitForKronangAccessGate() {
  if (!window.kronangSupabase) { setTimeout(waitForKronangAccessGate, 100); return; }
  loadKronangAccessState();
  document.addEventListener('kronang:auth-signed-in', loadKronangAccessState);
  document.addEventListener('kronang:auth-signed-out', function () { removeAccessStatusScreen(); document.body.classList.remove('access-resolving', 'access-blocked'); });
}

if (typeof module !== 'undefined' && module.exports) module.exports = { allowedPagesForRole, buildAccessState };
if (typeof window !== 'undefined' && typeof document !== 'undefined') { document.body.classList.add('access-resolving'); waitForKronangAccessGate(); }
