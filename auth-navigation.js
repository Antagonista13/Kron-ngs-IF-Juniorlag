const HOME_AFTER_LOGIN_KEY = 'kronangOpenHomeAfterLogin';

function goHomeAfterLogin(targetWindow) {
  if (!targetWindow || !targetWindow.location) return;
  if (targetWindow.sessionStorage && typeof targetWindow.sessionStorage.setItem === 'function') targetWindow.sessionStorage.setItem(HOME_AFTER_LOGIN_KEY, '1');
  const path = `${targetWindow.location.pathname || ''}${targetWindow.location.search || ''}`;
  if (targetWindow.history && typeof targetWindow.history.replaceState === 'function') targetWindow.history.replaceState(null, '', path || '/');
  if (typeof targetWindow.location.reload === 'function') targetWindow.location.reload();
}

function restoreHomeAfterLogin(targetWindow, targetDocument) {
  if (!targetWindow || !targetDocument || !targetWindow.sessionStorage) return false;
  if (targetWindow.sessionStorage.getItem(HOME_AFTER_LOGIN_KEY) !== '1') return false;

  const pages = targetDocument.querySelectorAll('.page');
  const navItems = targetDocument.querySelectorAll('.nav-item');
  if (!pages || !pages.length || !navItems || !navItems.length) return false;

  pages.forEach(function (page) { page.classList.remove('active'); if (page.id === 'homePage') page.classList.add('active'); });
  navItems.forEach(function (item) { item.classList.remove('active'); if (item.dataset && item.dataset.page === 'homePage') item.classList.add('active'); });

  targetWindow.sessionStorage.removeItem(HOME_AFTER_LOGIN_KEY);
  const scrollHome = function () { if (typeof targetWindow.scrollTo === 'function') targetWindow.scrollTo(0, 0); };
  if (typeof targetWindow.requestAnimationFrame === 'function') targetWindow.requestAnimationFrame(function(){ targetWindow.requestAnimationFrame(scrollHome); });
  else scrollHome();
  return true;
}

function installHomeAfterLoginRestore(targetWindow, targetDocument, restoreFn) {
  if (!targetWindow || !targetDocument) return;
  const run = function () { (restoreFn || restoreHomeAfterLogin)(targetWindow, targetDocument); };
  if (targetDocument.readyState === 'complete') run();
  else if (typeof targetWindow.addEventListener === 'function') targetWindow.addEventListener('load', run, { once: true });
}

if (typeof module !== 'undefined' && module.exports) module.exports = { goHomeAfterLogin, restoreHomeAfterLogin, installHomeAfterLoginRestore };
if (typeof window !== 'undefined') {
  window.goHomeAfterLogin = function () { goHomeAfterLogin(window); };
  if (typeof document !== 'undefined') installHomeAfterLoginRestore(window, document);
}
