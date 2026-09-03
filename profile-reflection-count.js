function hasReflection(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function countPlayerReflections(goals, focuses) {
  const goalCount = (goals || []).filter(function (goal) { return hasReflection(goal.final_reflection); }).length;
  const focusCount = (focuses || []).filter(function (focus) { return hasReflection(focus.player_reflection); }).length;
  return goalCount + focusCount;
}
function setProfileReflectionCount(count) {
  const stat = document.querySelector('#profilePage .profile-stats .stat-card:nth-child(2) strong');
  if (stat) stat.textContent = String(count || 0);
}
async function loadProfileReflectionCount() {
  if (!window.kronangSupabase) return;
  const { data: sessionData } = await window.kronangSupabase.auth.getSession();
  const user = sessionData.session ? sessionData.session.user : null;
  if (!user) { setProfileReflectionCount(0); return; }
  const { data: profile } = await window.kronangSupabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'player') { setProfileReflectionCount(0); return; }
  const [goalResult, focusResult] = await Promise.all([
    window.kronangSupabase.from('development_goals').select('final_reflection').eq('status', 'completed'),
    window.kronangSupabase.from('development_focuses').select('player_reflection').eq('lifecycle_status', 'completed')
  ]);
  if (goalResult.error) console.error('Kunde inte hämta målreflektioner:', goalResult.error);
  if (focusResult.error) console.error('Kunde inte hämta fokusreflektioner:', focusResult.error);
  setProfileReflectionCount(countPlayerReflections(goalResult.data || [], focusResult.data || []));
}
function waitForProfileReflectionCount() {
  if (!window.kronangSupabase) { setTimeout(waitForProfileReflectionCount, 100); return; }
  window.kronangSupabase.auth.onAuthStateChange(function (_event, session) {
    if (session) loadProfileReflectionCount(); else setProfileReflectionCount(0);
  });
  window.addEventListener('kronang-auth-changed', loadProfileReflectionCount);
  loadProfileReflectionCount();
}
if (typeof module !== 'undefined' && module.exports) module.exports = { countPlayerReflections };
if (typeof window !== 'undefined' && typeof document !== 'undefined') waitForProfileReflectionCount();
