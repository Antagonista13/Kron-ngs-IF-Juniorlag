function profileRolePresentation(role) {
  const isParent = role === 'parent';
  const isLeader = role === 'coach' || role === 'admin';
  return {
    showPlayerDevelopment: role === 'player',
    showLeaderProfile: isLeader,
    showParentInfo: isParent,
    showAdminStatus: role === 'admin',
    roleLabel: role === 'admin' ? 'Admin' : role === 'coach' ? 'Ledare' : '',
    subtitle: isLeader ? 'Din ledarprofil och dina verktyg.' : isParent ? 'Här hittar du information kopplad till ditt konto.' : 'Din utveckling börjar med dig.'
  };
}

function applyProfileRoleView(role) {
  if (typeof document === 'undefined') return;
  const view = profileRolePresentation(role);
  document.querySelectorAll('[data-player-profile-section]').forEach(function (section) {
    section.hidden = !view.showPlayerDevelopment;
    section.style.display = view.showPlayerDevelopment ? '' : 'none';
  });
  const parentInfo = document.getElementById('parentProfileInfo');
  if (parentInfo) {
    parentInfo.hidden = !view.showParentInfo;
    parentInfo.style.display = view.showParentInfo ? '' : 'none';
  }
  const leaderProfile = document.getElementById('leaderProfile');
  if (leaderProfile) {
    leaderProfile.hidden = !view.showLeaderProfile;
    leaderProfile.style.display = view.showLeaderProfile ? '' : 'none';
  }
  const roleLabel = document.getElementById('leaderProfileRole');
  if (roleLabel) roleLabel.textContent = view.roleLabel;
  const adminStatus = document.getElementById('leaderAdminStatus');
  if (adminStatus) {
    adminStatus.hidden = !view.showAdminStatus;
    adminStatus.style.display = view.showAdminStatus ? '' : 'none';
  }
  const subtitle = document.getElementById('profileSubtitle');
  if (subtitle) subtitle.textContent = view.subtitle;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { profileRolePresentation, applyProfileRoleView };

if (typeof document !== 'undefined') {
  document.addEventListener('kronang:access-state', function (event) {
    applyProfileRoleView(event.detail && event.detail.role ? event.detail.role : 'pending');
  });
  const initialRole = document.body && document.body.dataset ? document.body.dataset.accessRole : '';
  if (initialRole) applyProfileRoleView(initialRole);
}
