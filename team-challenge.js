function canManageTeamChallenge(role) { return role === 'coach' || role === 'admin'; }
function shouldRefreshChallengeForAuthEvent(eventName, session) {
  if (eventName === 'SIGNED_OUT') return true;
  return eventName === 'SIGNED_IN' && Boolean(session && session.user);
}
function validateTeamChallenge(title, instruction) {
  const cleanTitle = String(title || '').trim();
  const cleanInstruction = String(instruction || '').trim();
  if (!cleanTitle) return { valid: false, message: 'Skriv en rubrik.' };
  if (!cleanInstruction) return { valid: false, message: 'Skriv en instruktion.' };
  return { valid: true, title: cleanTitle.toLocaleUpperCase('sv-SE'), instruction: cleanInstruction };
}
function buildTeamChallengeViewModel(row) {
  if (!row) return null;
  return { id: row.id || '', title: row.title || '', instruction: row.instruction || '', completed: Boolean(row.completed) };
}
function clearChallengeUserState() {
  const manager = document.getElementById('teamChallengeManager');
  if (manager) manager.remove();
  const button = document.getElementById('challengeButton');
  if (button) {
    button.hidden = true;
    button.disabled = false;
    button.onclick = null;
    button.textContent = 'JAG ÄR KLAR ✓';
  }
}
function renderChallengeHome(model, profile) {
  const card = document.querySelector('#homePage .card.challenge');
  if (!card) return;
  const title = card.querySelector('h2');
  const text = card.querySelector('p');
  const button = card.querySelector('#challengeButton');
  if (!model) {
    if (title) title.textContent = 'INGEN AKTIV UTMANING';
    if (text) text.textContent = 'Tränaren har inte lagt ut någon utmaning ännu.';
    if (button) button.hidden = true;
    return;
  }
  if (title) title.textContent = model.title;
  if (text) text.textContent = model.instruction;
  if (!button) return;
  if (!profile || profile.role !== 'player') {
    button.hidden = true;
    button.disabled = false;
    button.onclick = null;
    button.textContent = 'JAG ÄR KLAR ✓';
    return;
  }
  button.hidden = false;
  button.disabled = model.completed;
  button.textContent = model.completed ? 'UTMANING KLAR! ✓' : 'JAG ÄR KLAR ✓';
  button.onclick = model.completed ? null : async function () {
    button.disabled = true;
    button.textContent = 'SPARAR...';
    const { error } = await window.kronangSupabase.from('challenge_completions').insert({ challenge_id: model.id, player_id: profile.id });
    if (error) {
      console.error('Kunde inte markera utmaningen klar:', error);
      button.disabled = false;
      button.textContent = 'JAG ÄR KLAR ✓';
      return;
    }
    button.textContent = 'UTMANING KLAR! ✓';
    await updateChallengeProfileCount(profile);
  };
}
function renderChallengeManager(profile, current) {
  const existing = document.getElementById('teamChallengeManager');
  if (existing) existing.remove();
  if (!canManageTeamChallenge(profile && profile.role)) return;
  const page = document.getElementById('teamPage');
  if (!page) return;
  const manager = document.createElement('section');
  manager.id = 'teamChallengeManager';
  manager.className = 'card team-focus-manager';
  manager.innerHTML = `<button type="button" id="openTeamChallengeManager">ÄNDRA VECKANS UTMANING</button><div id="teamChallengeForm" hidden><label for="teamChallengeTitle">Rubrik</label><input id="teamChallengeTitle" maxlength="160" placeholder="Exempel: 1000 touches"><label for="teamChallengeInstruction">Instruktion</label><textarea id="teamChallengeInstruction" rows="4" maxlength="1000" placeholder="Beskriv utmaningen..."></textarea><div class="team-post-form-actions"><button type="button" id="saveTeamChallenge">SPARA UTMANING</button><button type="button" id="cancelTeamChallenge">AVBRYT</button></div><p id="teamChallengeMessage"></p></div>`;
  const focusManager = document.getElementById('teamFocusManager');
  if (focusManager) focusManager.insertAdjacentElement('afterend', manager); else page.querySelector('.page-heading').insertAdjacentElement('afterend', manager);
  const form = manager.querySelector('#teamChallengeForm');
  const title = manager.querySelector('#teamChallengeTitle');
  const instruction = manager.querySelector('#teamChallengeInstruction');
  if (current) { title.value = current.title || ''; instruction.value = current.instruction || ''; }
  manager.querySelector('#openTeamChallengeManager').onclick = () => { form.hidden = false; };
  manager.querySelector('#cancelTeamChallenge').onclick = () => { form.hidden = true; };
  manager.querySelector('#saveTeamChallenge').onclick = async function () {
    const check = validateTeamChallenge(title.value, instruction.value);
    const message = manager.querySelector('#teamChallengeMessage');
    if (!check.valid) { message.textContent = check.message; return; }
    this.disabled = true;
    await window.kronangSupabase.from('team_challenges').update({ active: false }).eq('team', profile.team).eq('active', true);
    const { error } = await window.kronangSupabase.from('team_challenges').insert({ team: profile.team, title: check.title, instruction: check.instruction, created_by: profile.id, active: true });
    this.disabled = false;
    if (error) { console.error('Kunde inte spara veckans utmaning:', error); message.textContent = 'Det gick inte att spara utmaningen.'; return; }
    form.hidden = true;
    await loadTeamChallenge(profile);
  };
}
async function updateChallengeProfileCount(profile) {
  if (!profile || profile.role !== 'player') return;
  const { count, error } = await window.kronangSupabase.from('challenge_completions').select('id', { count: 'exact', head: true }).eq('player_id', profile.id);
  if (error) return;
  const stat = document.querySelector('#profilePage .profile-stats .stat-card:first-child strong');
  if (stat) stat.textContent = String(count || 0);
}
async function loadTeamChallenge(profile) {
  const { data: challenge, error } = await window.kronangSupabase.from('team_challenges').select('id, title, instruction, active, created_at').eq('team', profile.team).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) { console.error('Kunde inte hämta veckans utmaning:', error); return; }
  let completed = false;
  if (challenge && profile.role === 'player') {
    const { data } = await window.kronangSupabase.from('challenge_completions').select('id').eq('challenge_id', challenge.id).eq('player_id', profile.id).maybeSingle();
    completed = Boolean(data);
  }
  renderChallengeHome(challenge ? buildTeamChallengeViewModel({ ...challenge, completed }) : null, profile);
  renderChallengeManager(profile, challenge);
  await updateChallengeProfileCount(profile);
}
async function setupTeamChallenge() {
  if (!window.kronangSupabase) return;
  const { data: sessionData } = await window.kronangSupabase.auth.getSession();
  if (!sessionData.session) { clearChallengeUserState(); return; }
  const { data: profile } = await window.kronangSupabase.from('profiles').select('id, role, team').eq('id', sessionData.session.user.id).maybeSingle();
  if (profile && profile.team) loadTeamChallenge(profile);
}
function handleChallengeAuthChange(eventName, session) {
  if (!shouldRefreshChallengeForAuthEvent(eventName, session)) return;
  clearChallengeUserState();
  if (eventName === 'SIGNED_IN') setupTeamChallenge();
}
function waitForTeamChallenge() {
  if (!window.kronangSupabase) { setTimeout(waitForTeamChallenge, 100); return; }
  setupTeamChallenge();
  document.addEventListener('kronang:auth-signed-in', function (event) {
    handleChallengeAuthChange('SIGNED_IN', event.detail && event.detail.session);
  });
  document.addEventListener('kronang:auth-signed-out', function () {
    handleChallengeAuthChange('SIGNED_OUT', null);
  });
}
if (typeof module !== 'undefined' && module.exports) module.exports = { canManageTeamChallenge, validateTeamChallenge, buildTeamChallengeViewModel, shouldRefreshChallengeForAuthEvent };
if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForTeamChallenge();
