function buildPlayerDevelopmentTrend(rows) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return [];
  const current = list[0] || {};
  const previous = list[1] || {};
  const areas = [
    ['Teknik','technique_self','technique_coach'],
    ['Spelförståelse','game_understanding_self','game_understanding_coach'],
    ['Fys','physical_self','physical_coach'],
    ['Mentalitet','mentality_self','mentality_coach']
  ];
  return areas.map(function(area) {
    return {
      label: area[0],
      selfCurrent: current[area[1]] ?? null,
      selfPrevious: list.length > 1 ? (previous[area[1]] ?? null) : null,
      coachCurrent: current[area[2]] ?? null,
      coachPrevious: list.length > 1 ? (previous[area[2]] ?? null) : null
    };
  });
}
function getDevelopmentTrendMountTarget() { return 'developmentPage'; }
function trendStars(value) {
  if (value === null || value === undefined) return '—';
  return '★'.repeat(value) + '☆'.repeat(5-value);
}
function trendChange(current, previous) {
  if (current === null || current === undefined || previous === null || previous === undefined) return '';
  const diff = current - previous;
  if (diff === 0) return 'Oförändrat';
  return diff > 0 ? '+' + diff : '−' + Math.abs(diff);
}
function ensurePlayerDevelopmentTrendCard() {
  const developmentPage = document.getElementById(getDevelopmentTrendMountTarget());
  if (!developmentPage) return null;
  let card = document.getElementById('profileDevelopmentTrend');
  if (card) {
    if (card.parentElement !== developmentPage) developmentPage.appendChild(card);
    return card;
  }
  card = document.createElement('section');
  card.id = 'profileDevelopmentTrend';
  card.className = 'card profile-development-trend';
  developmentPage.appendChild(card);
  return card;
}
function renderPlayerDevelopmentTrend(model, hasPrevious) {
  const card = ensurePlayerDevelopmentTrendCard();
  if (!card) return;
  const heading = document.createElement('h3');
  heading.textContent = 'Min utveckling över tid';
  const intro = document.createElement('p');
  intro.className = 'profile-trend-intro';
  intro.textContent = hasPrevious ? 'Senaste bedömningen jämförd med föregående.' : 'Din första bedömning är startpunkten. Jämförelsen fylls på vid nästa bedömning.';
  card.replaceChildren(heading, intro);
  if (!model.length) {
    const empty = document.createElement('p'); empty.textContent = 'Ingen bedömning finns ännu.'; card.appendChild(empty); return;
  }
  const grid = document.createElement('div'); grid.className = 'profile-trend-grid';
  model.forEach(function(item) {
    const row = document.createElement('article'); row.className = 'profile-trend-row';
    const title = document.createElement('h4'); title.textContent = item.label;
    const self = document.createElement('div'); self.className = 'profile-trend-line';
    self.innerHTML = '<span>Min skattning</span><strong>' + trendStars(item.selfCurrent) + '</strong>' + (hasPrevious ? '<small>' + trendChange(item.selfCurrent,item.selfPrevious) + '</small>' : '');
    const coach = document.createElement('div'); coach.className = 'profile-trend-line';
    coach.innerHTML = '<span>Tränarens bedömning</span><strong>' + trendStars(item.coachCurrent) + '</strong>' + (hasPrevious ? '<small>' + trendChange(item.coachCurrent,item.coachPrevious) + '</small>' : '');
    row.append(title,self,coach); grid.appendChild(row);
  });
  card.appendChild(grid);
}
async function loadPlayerDevelopmentTrend() {
  if (!window.kronangSupabase) return;
  const { data: sessionData } = await window.kronangSupabase.auth.getSession();
  const user = sessionData.session ? sessionData.session.user : null;
  if (!user) return;
  const { data: profile } = await window.kronangSupabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if (!profile || profile.role !== 'player') { const card=document.getElementById('profileDevelopmentTrend'); if(card) card.remove(); return; }
  const { data, error } = await window.kronangSupabase.from('development_assessments')
    .select('technique_self,technique_coach,game_understanding_self,game_understanding_coach,physical_self,physical_coach,mentality_self,mentality_coach,created_at')
    .eq('player_id',user.id).order('created_at',{ascending:false}).limit(2);
  if (error) { console.error('Kunde inte hämta utveckling över tid:',error); return; }
  renderPlayerDevelopmentTrend(buildPlayerDevelopmentTrend(data || []),(data || []).length > 1);
}
function waitForPlayerDevelopmentTrend() {
  if (!window.kronangSupabase) { setTimeout(waitForPlayerDevelopmentTrend,100); return; }
  window.kronangSupabase.auth.onAuthStateChange(function(_event,session){ if(session) loadPlayerDevelopmentTrend(); else { const card=document.getElementById('profileDevelopmentTrend'); if(card) card.remove(); } });
  window.addEventListener('kronang-auth-changed',loadPlayerDevelopmentTrend);
  loadPlayerDevelopmentTrend();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { buildPlayerDevelopmentTrend, trendChange, getDevelopmentTrendMountTarget };
if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForPlayerDevelopmentTrend();
