const VALID_ROLES = Object.freeze(['admin','coach','player','parent','pending']);
const ACTIVE_ROLES = new Set(['admin','coach','player','parent']);
const LEADER_ROLES = new Set(['admin','coach']);

function normalizeRole(role){ return VALID_ROLES.includes(role) ? role : 'pending'; }
function isActiveRole(role){ return ACTIVE_ROLES.has(normalizeRole(role)); }
function isLeaderRole(role){ return LEADER_ROLES.has(normalizeRole(role)); }
function canViewNews(role){ return isActiveRole(role); }
function canViewCalendar(role){ return isActiveRole(role); }
function canViewWeeklyFocus(role){ return ['admin','coach','player'].includes(normalizeRole(role)); }
function canViewWeeklyChallenge(role){ return canViewWeeklyFocus(role); }
function canViewOwnDevelopment(role){ return ['admin','coach','player'].includes(normalizeRole(role)); }
function canViewRoster(role){ return isLeaderRole(role); }
function canManageTeamContent(role){ return isLeaderRole(role); }
function canManageUsers(role){ return normalizeRole(role)==='admin'; }
function canViewAdministration(role){ return canManageUsers(role); }

const api = { normalizeRole,isActiveRole,isLeaderRole,canViewNews,canViewCalendar,canViewWeeklyFocus,canViewWeeklyChallenge,canViewOwnDevelopment,canViewRoster,canManageTeamContent,canManageUsers,canViewAdministration };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.KronangPermissions = Object.freeze(api);
