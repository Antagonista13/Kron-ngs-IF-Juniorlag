function activateHome(targetWindow, targetDocument) {
  if (!targetWindow || !targetDocument) return false;
  const pages = targetDocument.querySelectorAll('.page');
  const navItems = targetDocument.querySelectorAll('.nav-item');
  if (!pages || !pages.length || !navItems || !navItems.length) return false;
  pages.forEach(function (page) { page.classList.remove('active'); if (page.id === 'homePage') page.classList.add('active'); });
  navItems.forEach(function (item) { item.classList.remove('active'); if (item.dataset && item.dataset.page === 'homePage') item.classList.add('active'); });
  const scrollHome = function () { if (typeof targetWindow.scrollTo === 'function') targetWindow.scrollTo(0, 0); };
  scrollHome();
  if (typeof targetWindow.requestAnimationFrame === 'function') targetWindow.requestAnimationFrame(scrollHome);
  return true;
}

function dispatchAuthEvent(targetDocument, name, session) {
  if (!targetDocument || typeof targetDocument.dispatchEvent !== 'function') return;
  let event;
  if (typeof CustomEvent === 'function') event = new CustomEvent(name, { detail: { session: session || null } });
  else event = { type: name, detail: { session: session || null } };
  targetDocument.dispatchEvent(event);
}

function resetAppStartState(targetDocument) {
  dispatchAuthEvent(targetDocument, 'kronang:app-start-reset', null);
}

function handleAuthNavigation(eventName, session, targetWindow, targetDocument) {
  if (eventName === 'SIGNED_IN') {
    resetAppStartState(targetDocument);
    activateHome(targetWindow, targetDocument);
    dispatchAuthEvent(targetDocument, 'kronang:auth-signed-in', session);
  } else if (eventName === 'SIGNED_OUT') {
    resetAppStartState(targetDocument);
    dispatchAuthEvent(targetDocument, 'kronang:auth-signed-out', null);
  }
}

function goHomeAfterLogin(targetWindow, targetDocument) { return activateHome(targetWindow, targetDocument); }

if (typeof module !== 'undefined' && module.exports) module.exports = { activateHome, handleAuthNavigation, goHomeAfterLogin, resetAppStartState };
if (typeof window !== 'undefined') {
  window.goHomeAfterLogin = function () { return activateHome(window, document); };
  window.handleKronangAuthNavigation = function (eventName, session) { return handleAuthNavigation(eventName, session, window, document); };
}
