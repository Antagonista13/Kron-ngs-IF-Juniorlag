function buildPostLoginUrl(locationLike, stamp) {
  const path = (locationLike && locationLike.pathname) || '/';
  const token = stamp || Date.now();
  return `${path}?login=${token}`;
}

function goHomeAfterLogin(targetWindow, stamp) {
  if (!targetWindow || !targetWindow.location) return;
  if (targetWindow.history && 'scrollRestoration' in targetWindow.history) {
    targetWindow.history.scrollRestoration = 'manual';
  }
  const nextUrl = buildPostLoginUrl(targetWindow.location, stamp);
  if (typeof targetWindow.location.replace === 'function') {
    targetWindow.location.replace(nextUrl);
    return;
  }
  targetWindow.location.href = nextUrl;
}

function restoreHomeAfterLogin(targetWindow, targetDocument) {
  if (!targetWindow || !targetDocument || !targetWindow.location) return false;
  const search = String(targetWindow.location.search || '');
  if (!/[?&]login=/.test(search)) return false;

  const pages = targetDocument.querySelectorAll('.page');
  const navItems = targetDocument.querySelectorAll('.nav-item');
  if (!pages || !pages.length || !navItems || !navItems.length) return false;

  pages.forEach(function (page) {
    page.classList.remove('active');
    if (page.id === 'homePage') page.classList.add('active');
  });

  navItems.forEach(function (item) {
    item.classList.remove('active');
    if (item.dataset && item.dataset.page === 'homePage') item.classList.add('active');
  });

  if (targetWindow.history && typeof targetWindow.history.replaceState === 'function') {
    targetWindow.history.replaceState(null, '', targetWindow.location.pathname || '/');
  }

  const scrollHome = function () {
    if (typeof targetWindow.scrollTo === 'function') targetWindow.scrollTo(0, 0);
  };

  scrollHome();
  if (typeof targetWindow.requestAnimationFrame === 'function') {
    targetWindow.requestAnimationFrame(scrollHome);
    targetWindow.requestAnimationFrame(function () {
      targetWindow.requestAnimationFrame(scrollHome);
    });
  }

  return true;
}

function installHomeAfterLoginRestore(targetWindow, targetDocument) {
  if (!targetWindow || !targetDocument) return;
  if (targetWindow.history && 'scrollRestoration' in targetWindow.history) {
    targetWindow.history.scrollRestoration = 'manual';
  }
  const run = function () { restoreHomeAfterLogin(targetWindow, targetDocument); };
  if (targetDocument.readyState === 'complete') run();
  else if (typeof targetWindow.addEventListener === 'function') targetWindow.addEventListener('load', run, { once: true });
  if (typeof targetWindow.addEventListener === 'function') targetWindow.addEventListener('pageshow', run);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildPostLoginUrl, goHomeAfterLogin, restoreHomeAfterLogin, installHomeAfterLoginRestore };
}

if (typeof window !== 'undefined') {
  window.goHomeAfterLogin = function () { goHomeAfterLogin(window); };
  if (typeof document !== 'undefined') installHomeAfterLoginRestore(window, document);
}
