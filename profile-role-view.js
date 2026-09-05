function applyProfileRoleView(role) {
  if (typeof document === 'undefined') return;
  const isParent = role === 'parent';
  document.querySelectorAll('[data-player-profile-section]').forEach(function (section) {
    section.hidden = isParent;
    section.style.display = isParent ? 'none' : '';
  });
  const parentInfo = document.getElementById('parentProfileInfo');
  if (parentInfo) {
    parentInfo.hidden = !isParent;
    parentInfo.style.display = isParent ? '' : 'none';
  }
  const subtitle = document.getElementById('profileSubtitle');
  if (subtitle) subtitle.textContent = isParent ? 'Här hittar du information kopplad till ditt konto.' : 'Din utveckling börjar med dig.';
}

if (typeof module !== 'undefined' && module.exports) module.exports = { applyProfileRoleView };

if (typeof document !== 'undefined') {
  document.addEventListener('kronang:access-state', function (event) {
    applyProfileRoleView(event.detail && event.detail.role ? event.detail.role : 'pending');
  });
  const initialRole = document.body && document.body.dataset ? document.body.dataset.accessRole : '';
  if (initialRole) applyProfileRoleView(initialRole);
}
