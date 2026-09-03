function hasAllValues(row, fields) {
  return Boolean(row) && fields.every(function(field) {
    return row[field] !== null && row[field] !== undefined;
  });
}
function buildPlayerDevelopmentTrend(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const selfFields = ['technique_self','game_understanding_self','physical_self','mentality_self'];
  const coachFields = ['technique_coach','game_understanding_coach','physical_coach','mentality_coach'];
  const selfRows = list.filter(function(row) { return hasAllValues(row, selfFields); });
  const coachRows = list.filter(function(row) { return hasAllValues(row, coachFields); });
  const selfCurrent = selfRows[0] || {};
  const selfPrevious = selfRows[1] || {};
  const coachCurrent = coachRows[0] || {};
  const coachPrevious = coachRows[1] || {};
  const areas = [
    ['Teknik','technique_self','technique_coach'],
    ['Spelförståelse','game_understanding_self','game_understanding_coach'],
    ['Fys','physical_self','physical_coach'],
    ['Mentalitet','mentality_self','mentality_coach']
  ];
  return {
    hasSelfPrevious: selfRows.length > 1,
    hasCoachPrevious: coachRows.length > 1,
    areas: areas.map(function(area) {
      return {
        label: area[0],
        selfCurrent: selfRows.length ? (selfCurrent[area[1]] ?? null) : null,
        selfPrevious: selfRows.length > 1 ? (selfPrevious[area[1]] ?? null) : null,
        coachCurrent: coachRows.length ? (coachCurrent[area[2]] ?? null) : null,
        coachPrevious: coachRows.length > 1 ? (coachPrevious[area[2]] ?? null) : null
      };
    })
  };
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
function renderPlayerDevelopmentTrend(model) {
  const card = ensurePlayerDevelopmentTrendCard();
  if (!card) return;
  const areas = model && Array.isArray(model.areas) ? model.areas : [];
  const heading = document.createElement('h3');
  heading.textContent = 'Min utveckling över tid';
  const intro = document.createElement('p');
  intro.className = 'profile-trend-intro';
  intro.textContent = (model && (model.hasSelfPrevious || model.hasCoachPrevious)) ? 'Senaste jämförbara bedömningen jämförd med föregående.' : 'Din första bedömning är startpunkten. Jämförelsen fylls på vid nästa bedömning.';
  card.replaceChildren(heading, intro);
  if (!areas.length) {
    const empty = document.createElement('p'); empty.textContent = 'Ingen bedömning finns ännu.'; card.appendChild(empty); return;
  }
  const grid = document.createElement('div'); grid.className = 'profile-trend-grid';
  areas.forEach(function(item) {
    const row = document.createElement('article'); row.className = 'profile-trend-row';
    const title = document.createElement('h4'); title.textContent = item.label;
    const self = document.createElement('div'); self.className = 'profile-trend-line';
    self.innerHTML = '<span>Min skattning</span><strong>' + trendStars(item.selfCurrent) + '</strong>' + (model.hasSelfPrevious ? '<small>' + trendChange(item.selfCurrent,item.selfPrevious) + '</small>' : '');
    const coach = document.createElement('div'); coach.className = 'profile-trend-line';
    coach.innerHTML = '<span>Tränarens bedömning</span><strong>' + trendStars(item.coachCurrent) + '</strong>' + (model.hasCoachPrevious ? '<small>' + trendChange(item.coachCurrent,item.coachPrevious) + '</small>' : '');
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
    .eq('player_id',user.id).order('created_at',{ascending:false}).limit(20);
  if (error) { console.error('Kunde inte hämta utveckling över tid:',error); return; }
  renderPlayerDevelopmentTrend(buildPlayerDevelopmentTrend(data || []));
}
function waitForPlayerDevelopmentTrend() {
  if (!window.kronangSupabase) { setTimeout(waitForPlayerDevelopmentTrend,100); return; }
  window.kronangSupabase.auth.onAuthStateChange(function(_event,session){ if(session) loadPlayerDevelopmentTrend(); else { const card=document.getElementById('profileDevelopmentTrend'); if(card) card.remove(); } });
  window.addEventListener('kronang-auth-changed',loadPlayerDevelopmentTrend);
  loadPlayerDevelopmentTrend();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { buildPlayerDevelopmentTrend, trendChange, getDevelopmentTrendMountTarget, hasAllValues };
if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForPlayerDevelopmentTrend();
