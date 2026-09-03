function adminRoleLabel(role) {
  return { admin: 'Admin', coach: 'Ledare', player: 'Spelare', parent: 'Förälder', pending: 'Väntar' }[role] || 'Väntar';
}
function buildAdminUserModel(row) {
  const item = row || {};
  const role = item.role || 'pending';
  return {
    id: item.profile_id || item.id || '',
    email: item.email || '',
    name: item.full_name || 'Namnlös användare',
    role,
    roleLabel: adminRoleLabel(role),
    displayTitle: item.display_title || '',
    isActive: item.is_active !== false,
    playerId: item.player_id || null,
    invitationStatus: item.invitation_status || '',
    expectedRole: item.expected_role || '',
    locked: role === 'admin'
  };
}
function buildAdminOverview(rows) {
  const items = (rows || []).map(buildAdminUserModel);
  return {
    pending: items.filter((item) => item.role === 'pending').length,
    activeUsers: items.filter((item) => item.role !== 'pending' && item.isActive).length,
    leaders: items.filter((item) => item.isActive && (item.role === 'admin' || item.role === 'coach')).length
  };
}
function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function roleOptions(selected) {
  return [['player','Spelare'],['parent','Förälder'],['coach','Ledare']].map(([value,label]) => `<option value="${value}"${selected===value?' selected':''}>${label}</option>`).join('');
}
function openPage(pageId) {
  document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page.id === pageId));
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.page === pageId));
}
function ensureAdminProfileEntry() {
  const profilePage = document.getElementById('profilePage');
  if (!profilePage) return null;
  let card = document.getElementById('adminProfileEntry');
  if (!card) {
    card = document.createElement('section');
    card.id = 'adminProfileEntry';
    card.className = 'card admin-profile-entry';
    card.innerHTML = '<span class="admin-kicker">ADMIN</span><h3>Administration</h3><p>Godkänn konton, hantera roller och bjud in personer.</p><button type="button" id="openAdminPage">ÖPPNA ADMINISTRATION</button>';
    const logout = profilePage.querySelector('.logout-card');
    if (logout) profilePage.insertBefore(card, logout); else profilePage.appendChild(card);
  }
  return card;
}
function setupAdminPage() {
  if (!window.kronangSupabase) return;
  const adminPage = document.getElementById('adminPage');
  if (!adminPage) return;
  const access = window.KronangAdminAccess;
  let currentRows = [];
  let availablePlayers = [];

  async function currentAdmin() {
    const { data: sessionData } = await window.kronangSupabase.auth.getSession();
    const user = sessionData.session && sessionData.session.user;
    if (!user) return null;
    const { data: profile } = await window.kronangSupabase.from('profiles').select('role,is_active').eq('id', user.id).maybeSingle();
    return profile && profile.role === 'admin' && profile.is_active !== false ? profile : null;
  }
  async function loadPlayers() {
    const result = await window.kronangSupabase.from('players').select('id,full_name,shirt_number,profile_id,is_active').eq('is_active', true).order('full_name', { ascending: true });
    availablePlayers = (result.data || []).filter((row) => !row.profile_id);
  }
  function playerOptions(selected) {
    return '<option value="">Välj spelare…</option>' + availablePlayers.map((row) => `<option value="${escapeHtml(row.id)}"${selected===row.id?' selected':''}>${escapeHtml(row.full_name)}${row.shirt_number ? ' #' + escapeHtml(row.shirt_number) : ''}</option>`).join('');
  }
  function renderOverview() {
    const host = document.getElementById('adminOverview');
    if (!host) return;
    const overview = buildAdminOverview(currentRows);
    host.innerHTML = `<div><strong>${overview.pending}</strong><span>väntar</span></div><div><strong>${overview.activeUsers}</strong><span>aktiva</span></div><div><strong>${overview.leaders}</strong><span>ledare</span></div>`;
  }
  function renderApprovals() {
    const host = document.getElementById('adminApprovals');
    if (!host) return;
    const pending = currentRows.map(buildAdminUserModel).filter((item) => item.role === 'pending');
    if (!pending.length) { host.innerHTML = '<p class="admin-empty">Ingen väntar på godkännande.</p>'; return; }
    host.innerHTML = pending.map((item) => `<article class="admin-user-card" data-pending-id="${escapeHtml(item.id)}"><div class="admin-user-head"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.email)}</span></div><span class="admin-status">VÄNTAR</span></div><label>Roll<select data-field="role"><option value="">Välj roll…</option>${roleOptions(item.expectedRole)}</select></label><label data-player-field hidden>Spelare<select data-field="player">${playerOptions('')}</select></label><label data-title-field hidden>Visningstitel<input data-field="title" placeholder="Exempel: Head Coach"></label><p class="admin-card-message" aria-live="polite"></p><div class="admin-actions"><button type="button" data-action="approve">GODKÄNN</button><button type="button" class="secondary" data-action="reject">NEKA</button></div></article>`).join('');
    host.querySelectorAll('[data-pending-id]').forEach((card) => {
      const role = card.querySelector('[data-field="role"]');
      const playerField = card.querySelector('[data-player-field]');
      const titleField = card.querySelector('[data-title-field]');
      const sync = () => { playerField.hidden = role.value !== 'player'; titleField.hidden = role.value !== 'coach'; };
      role.addEventListener('change', sync); sync();
      card.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]'); if (!button) return;
        const id = card.dataset.pendingId, message = card.querySelector('.admin-card-message');
        button.disabled = true; message.textContent = '';
        if (button.dataset.action === 'reject') {
          const result = await window.kronangSupabase.rpc('admin_reject_user', { p_profile_id: id });
          if (result.error) message.textContent = 'Kunde inte neka kontot.'; else await loadAll();
          button.disabled = false; return;
        }
        const validation = access.validateApproval({ role: role.value, playerId: card.querySelector('[data-field="player"]').value, displayTitle: card.querySelector('[data-field="title"]').value });
        if (!validation.ok) { message.textContent = validation.message; button.disabled = false; return; }
        const value = validation.value;
        const result = await window.kronangSupabase.rpc('admin_approve_user', { p_profile_id: id, p_role: value.role, p_player_id: value.playerId, p_display_title: value.displayTitle });
        if (result.error) message.textContent = 'Kunde inte godkänna kontot.'; else await loadAll();
        button.disabled = false;
      });
    });
  }
  function renderUsers() {
    const host = document.getElementById('adminUsers');
    if (!host) return;
    const users = currentRows.map(buildAdminUserModel).filter((item) => item.role !== 'pending');
    host.innerHTML = users.map((item) => {
      if (item.locked) return `<article class="admin-user-card locked"><div class="admin-user-head"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.email)}</span></div><span class="admin-locked">LÅST ADMIN</span></div><p>${escapeHtml(item.displayTitle || item.roleLabel)}</p></article>`;
      return `<article class="admin-user-card" data-user-id="${escapeHtml(item.id)}"><div class="admin-user-head"><div><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.email)}</span></div><span>${escapeHtml(item.roleLabel)}</span></div><label>Roll<select data-field="role">${roleOptions(item.role)}</select></label><label data-player-field${item.role==='player'?'':' hidden'}>Spelare<select data-field="player">${playerOptions(item.playerId)}</select></label><label data-title-field${item.role==='coach'?'':' hidden'}>Visningstitel<input data-field="title" value="${escapeHtml(item.displayTitle)}"></label><label class="admin-active-toggle"><input type="checkbox" data-field="active"${item.isActive?' checked':''}> Aktiv åtkomst</label><p class="admin-card-message" aria-live="polite"></p><button type="button" data-action="save">SPARA</button></article>`;
    }).join('');
    host.querySelectorAll('[data-user-id]').forEach((card) => {
      const role = card.querySelector('[data-field="role"]');
      const sync = () => { card.querySelector('[data-player-field]').hidden = role.value !== 'player'; card.querySelector('[data-title-field]').hidden = role.value !== 'coach'; };
      role.addEventListener('change', sync); sync();
      card.querySelector('[data-action="save"]').addEventListener('click', async function () {
        const message = card.querySelector('.admin-card-message');
        const validation = access.validateApproval({ role: role.value, playerId: card.querySelector('[data-field="player"]').value, displayTitle: card.querySelector('[data-field="title"]').value });
        if (!validation.ok) { message.textContent = validation.message; return; }
        this.disabled = true; message.textContent = '';
        const value = validation.value;
        const result = await window.kronangSupabase.rpc('admin_update_user_access', { p_profile_id: card.dataset.userId, p_role: value.role, p_player_id: value.playerId, p_display_title: value.displayTitle, p_is_active: card.querySelector('[data-field="active"]').checked });
        if (result.error) message.textContent = 'Kunde inte spara ändringen.'; else { message.textContent = 'Sparat.'; await loadAll(); }
        this.disabled = false;
      });
    });
  }
  async function loadAll() {
    const [usersResult] = await Promise.all([window.kronangSupabase.rpc('admin_list_users'), loadPlayers()]);
    if (usersResult.error) { document.getElementById('adminApprovals').innerHTML = '<p class="admin-empty">Administrationen kunde inte hämtas.</p>'; return; }
    currentRows = usersResult.data || [];
    renderOverview(); renderApprovals(); renderUsers();
  }
  async function activate() {
    const admin = await currentAdmin();
    const entry = ensureAdminProfileEntry();
    if (!admin) { if (entry) entry.remove(); return; }
    entry.hidden = false;
    const open = entry.querySelector('#openAdminPage');
    if (!open.dataset.ready) { open.dataset.ready = 'true'; open.addEventListener('click', async () => { openPage('adminPage'); await loadAll(); }); }
  }
  const back = document.getElementById('adminBackButton');
  if (back && !back.dataset.ready) { back.dataset.ready = 'true'; back.addEventListener('click', () => openPage('profilePage')); }
  document.addEventListener('kronang:auth-signed-in', activate);
  document.addEventListener('kronang:auth-signed-out', () => { const entry = document.getElementById('adminProfileEntry'); if (entry) entry.remove(); });
  activate();
}
function waitForAdminPage() { if (window.kronangSupabase) setupAdminPage(); else setTimeout(waitForAdminPage, 100); }
const adminPageApi = { adminRoleLabel, buildAdminUserModel, buildAdminOverview };
if (typeof module !== 'undefined' && module.exports) module.exports = adminPageApi;
if (typeof window !== 'undefined') { window.KronangAdminPage = adminPageApi; if (typeof document !== 'undefined') waitForAdminPage(); }
