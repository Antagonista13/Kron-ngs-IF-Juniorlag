function goHomeAfterLogin(targetWindow) {
  if (!targetWindow || !targetWindow.location) return;
  const path = `${targetWindow.location.pathname || ''}${targetWindow.location.search || ''}`;
  if (targetWindow.history && typeof targetWindow.history.replaceState === 'function') {
    targetWindow.history.replaceState(null, '', path || '/');
  }
  if (typeof targetWindow.location.reload === 'function') targetWindow.location.reload();
}

if (typeof module !== 'undefined' && module.exports) module.exports = { goHomeAfterLogin };
if (typeof window !== 'undefined') window.goHomeAfterLogin = function () { goHomeAfterLogin(window); };
