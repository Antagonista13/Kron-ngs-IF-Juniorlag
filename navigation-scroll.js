function scrollPageTop(win) {
  const target = win || (typeof window !== 'undefined' ? window : null);
  if (!target || typeof target.scrollTo !== 'function') return;
  target.scrollTo(0, 0);
}

function configureScrollRestoration(win) {
  const target = win || (typeof window !== 'undefined' ? window : null);
  if (!target || !target.history || !('scrollRestoration' in target.history)) return;
  target.history.scrollRestoration = 'manual';
}

function setupNavigationScroll(doc, win) {
  if (!doc || !win) return;
  configureScrollRestoration(win);

  const scrollNow = () => scrollPageTop(win);
  scrollNow();
  win.addEventListener('pageshow', scrollNow);

  doc.addEventListener('click', (event) => {
    const navTarget = event.target && event.target.closest
      ? event.target.closest('.nav-item, #openAdminPage, #adminBackButton')
      : null;
    if (navTarget) setTimeout(scrollNow, 0);
  });

  const observer = new MutationObserver((mutations) => {
    const pageChanged = mutations.some((mutation) =>
      mutation.type === 'attributes' &&
      mutation.attributeName === 'class' &&
      mutation.target &&
      mutation.target.classList &&
      mutation.target.classList.contains('page')
    );
    if (pageChanged) setTimeout(scrollNow, 0);
  });

  doc.querySelectorAll('.page').forEach((page) => {
    observer.observe(page, { attributes: true, attributeFilter: ['class'] });
  });
}

const navigationScrollApi = { scrollPageTop, configureScrollRestoration, setupNavigationScroll };
if (typeof module !== 'undefined' && module.exports) module.exports = navigationScrollApi;
if (typeof window !== 'undefined') {
  window.KronangNavigationScroll = navigationScrollApi;
  if (typeof document !== 'undefined') setupNavigationScroll(document, window);
}
