const HOME_AFTER_LOGIN_KEY = 'kronangOpenHomeAfterLogin';

function goHomeAfterLogin(targetWindow) {
  if (!targetWindow || !targetWindow.location) return;

  if (targetWindow.sessionStorage && typeof targetWindow.sessionStorage.setItem === 'function') {
    targetWindow.sessionStorage.setItem(HOME_AFTER_LOGIN_KEY, '1');
  }

  const path = `${targetWindow.location.pathname || ''}${targetWindow.location.search || ''}`;
  if (targetWindow.history && typeof targetWindow.history.replaceState === 'function') {
    targetWindow.history.replaceState(null, '', path || '/');
  }

  if (typeof targetWindow.location.reload === 'function') {
    targetWindow.location.reload();
  }
}

function restoreHomeAfterLogin(targetWindow, targetDocument) {
  if (!targetWindow || !targetDocument || !targetWindow.sessionStorage) return false;
  if (targetWindow.sessionStorage.getItem(HOME_AFTER_LOGIN_KEY) !== '1') return false;

  targetWindow.sessionStorage.removeItem(HOME_AFTER_LOGIN_KEY);

  const pages = targetDocument.querySelectorAll('.page');
  pages.forEach(function (page) {
    page.classList.remove('active');
    if (page.id === 'homePage') page.classList.add('active');
  });

  const navItems = targetDocument.querySelectorAll('.nav-item');
  navItems.forEach(function (item) {
    item.classList.remove('active');
    if (item.dataset && item.dataset.page === 'homePage') item.classList.add('active');
  });

  const scrollHome = function () {
    if (typeof targetWindow.scrollTo === 'function') targetWindow.scrollTo(0, 0);
  };

  if (typeof targetWindow.requestAnimationFrame === 'function') {
    targetWindow.requestAnimationFrame(scrollHome);
  } else {
    scrollHome();
  }

  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { goHomeAfterLogin, restoreHomeAfterLogin };
}

if (typeof window !== 'undefined') {
  window.goHomeAfterLogin = function () { goHomeAfterLogin(window); };
  if (typeof document !== 'undefined') restoreHomeAfterLogin(window, document);
}
