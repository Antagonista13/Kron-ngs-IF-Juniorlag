function getHistoryAreaLabel(area) {
  const labels = { technique: 'TEKNIK', game_understanding: 'SPELFÖRSTÅELSE', physical: 'FYS', mentality: 'MENTALITET' };
  return labels[area] || 'FOKUS';
}

function buildDevelopmentHistory(goals, focuses, challenges) {
  const items = [];

  (goals || []).forEach(function (goal) {
    if (!goal.completed_at) return;
    items.push({
      type: 'goal',
      label: 'MÅL',
      title: goal.title || 'Avslutat mål',
      reflection: goal.final_reflection || '',
      date: goal.completed_at
    });
  });

  (focuses || []).forEach(function (focus) {
    if (!focus.ended_at) return;
    items.push({
      type: 'focus',
      label: 'FOKUS · ' + getHistoryAreaLabel(focus.development_area),
      title: focus.focus_text || 'Avslutat fokus',
      reflection: focus.player_reflection || '',
      date: focus.ended_at
    });
  });

  (challenges || []).forEach(function (challenge) {
    if (!challenge.completed_at) return;
    items.push({
      type: 'challenge',
      label: 'UTMANING',
      title: challenge.title || 'Genomförd utmaning',
      reflection: '',
      date: challenge.completed_at
    });
  });

  return items.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
}

function formatDevelopmentHistoryDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function ensureDevelopmentHistoryCard() {
  const profilePage = document.getElementById('profilePage');
  if (!profilePage) return null;
  let card = document.getElementById('profileDevelopmentHistory');
  if (card) return card;
  card = document.createElement('section');
  card.id = 'profileDevelopmentHistory';
  card.className = 'card profile-development-history';
  const goalCard = document.getElementById('profileGoalCard');
  if (goalCard) goalCard.insertAdjacentElement('afterend', card);
  else profilePage.appendChild(card);
  return card;
}

function renderDevelopmentHistory(items) {
  const card = ensureDevelopmentHistoryCard();
  if (!card) return;
  const heading = document.createElement('h3');
  heading.textContent = 'Min utvecklingshistorik';
  const intro = document.createElement('p');
  intro.className = 'profile-history-intro';
  intro.textContent = 'Dina senaste avslutade mål, fokus och utmaningar.';
  card.replaceChildren(heading, intro);

  const visibleItems = (items || []).slice(0, 5);
  if (visibleItems.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Din utvecklingshistorik fylls på när du avslutar mål, fokus eller utmaningar.';
    card.appendChild(empty);
    return;
  }

  const list = document.createElement('div');
  list.className = 'profile-history-list';
  visibleItems.forEach(function (item) {
    const article = document.createElement('article');
    article.className = 'profile-history-item';
    const top = document.createElement('div');
    top.className = 'profile-history-top';
    const label = document.createElement('strong');
    label.className = 'profile-history-label';
    label.textContent = item.label;
    const date = document.createElement('span');
    date.textContent = formatDevelopmentHistoryDate(item.date);
    top.append(label, date);
    const title = document.createElement('h4');
    title.textContent = item.title;
    article.append(top, title);
    if (item.reflection) {
      const reflection = document.createElement('p');
      reflection.textContent = item.reflection;
      article.appendChild(reflection);
    }
    list.appendChild(article);
  });
  card.appendChild(list);
}

async function loadDevelopmentHistory() {
  if (!window.kronangSupabase) return;
  const { data: sessionData } = await window.kronangSupabase.auth.getSession();
  const user = sessionData.session ? sessionData.session.user : null;
  if (!user) { renderDevelopmentHistory([]); return; }

  const { data: profile } = await window.kronangSupabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'player') {
    const card = document.getElementById('profileDevelopmentHistory');
    if (card) card.remove();
    return;
  }

  const [goalResult, focusResult, completionResult] = await Promise.all([
    window.kronangSupabase.from('development_goals').select('title, final_reflection, completed_at').eq('status', 'completed'),
    window.kronangSupabase.from('development_focuses').select('development_area, focus_text, player_reflection, ended_at').eq('lifecycle_status', 'completed'),
    window.kronangSupabase.from('challenge_completions').select('challenge_id, completed_at').eq('player_id', user.id)
  ]);

  if (goalResult.error) console.error('Kunde inte hämta målhistorik till profil:', goalResult.error);
  if (focusResult.error) console.error('Kunde inte hämta fokushistorik till profil:', focusResult.error);
  if (completionResult.error) console.error('Kunde inte hämta utmaningshistorik till profil:', completionResult.error);

  const completions = completionResult.data || [];
  let challengeRows = [];
  const challengeIds = completions.map(function (row) { return row.challenge_id; });
  if (challengeIds.length > 0) {
    const { data: challengeData, error: challengeError } = await window.kronangSupabase.from('team_challenges').select('id, title').in('id', challengeIds);
    if (challengeError) console.error('Kunde inte hämta utmaningstitlar till profil:', challengeError);
    const titleById = {};
    (challengeData || []).forEach(function (challenge) { titleById[challenge.id] = challenge.title; });
    challengeRows = completions.map(function (completion) {
      return { title: titleById[completion.challenge_id] || 'Genomförd utmaning', completed_at: completion.completed_at };
    });
  }

  renderDevelopmentHistory(buildDevelopmentHistory(goalResult.data || [], focusResult.data || [], challengeRows));
}

function waitForDevelopmentHistory() {
  if (!window.kronangSupabase) { setTimeout(waitForDevelopmentHistory, 100); return; }
  window.kronangSupabase.auth.onAuthStateChange(function (_event, session) {
    if (session) loadDevelopmentHistory();
    else {
      const card = document.getElementById('profileDevelopmentHistory');
      if (card) card.remove();
    }
  });
  window.addEventListener('kronang-auth-changed', loadDevelopmentHistory);
  loadDevelopmentHistory();
}

if (typeof module !== 'undefined' && module.exports) module.exports = { buildDevelopmentHistory };
if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForDevelopmentHistory();
