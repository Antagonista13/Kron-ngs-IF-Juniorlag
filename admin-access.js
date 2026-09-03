function normalizeApprovalRole(role) {
  return ['player', 'parent', 'coach'].includes(role) ? role : '';
}
function validateApproval(input) {
  const item = input || {};
  const role = normalizeApprovalRole(String(item.role || '').trim());
  if (!role) return { ok: false, message: 'Välj en giltig roll.' };
  const playerId = item.playerId ? String(item.playerId) : null;
  const displayTitle = String(item.displayTitle || '').trim() || null;
  if (role === 'player' && !playerId) return { ok: false, message: 'Välj vilken spelare kontot tillhör.' };
  return { ok: true, message: '', value: { role, playerId: role === 'player' ? playerId : null, displayTitle: role === 'coach' ? displayTitle : null } };
}
function validateInvite(input) {
  const item = input || {};
  const email = String(item.email || '').trim().toLowerCase();
  const fullName = String(item.fullName || '').trim();
  const expectedRole = String(item.expectedRole || '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: 'Ange en giltig e-postadress.' };
  if (!fullName) return { ok: false, message: 'Ange personens namn.' };
  if (!['', 'player', 'parent', 'coach'].includes(expectedRole)) return { ok: false, message: 'Välj en giltig förväntad roll.' };
  return { ok: true, message: '', value: { email, fullName, expectedRole } };
}
const api = { normalizeApprovalRole, validateApproval, validateInvite };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.KronangAdminAccess = api;
