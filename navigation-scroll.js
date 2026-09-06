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

function resetNestedPageState(pageId, doc) {
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (pageId !== 'developmentPage' || !targetDoc) return false;

  const coachView = targetDoc.getElementById('coachDevelopmentView');
  const detail = targetDoc.getElementById('coachPlayerDevelopment');
  const worklist = targetDoc.getElementById('developmentWorklist');

  if (coachView && coachView.classList) coachView.classList.remove('coach-player-detail-open');
  if (detail) {
    detail.hidden = true;
    detail.innerHTML = '';
  }
  if (worklist) worklist.hidden = false;

  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('coach-player-quick-tool-open');
  }

  return Boolean(coachView || detail || worklist);
}

function scrollToPageLanding(pageId, doc, win) {
  const targetDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (pageId === 'developmentPage' && targetDoc) {
    const page = targetDoc.getElementById('developmentPage');
    if (page && typeof page.scrollIntoView === 'function') {
      page.scrollIntoView({ behavior: 'auto', block: 'start' });
      return true;
    }
  }
  scrollPageTop(win);
  return false;
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
    if (!navTarget) return;

    if (navTarget.classList && navTarget.classList.contains('nav-item')) {
      const pageId = navTarget.getAttribute('data-page');
      resetNestedPageState(pageId, doc);
      if (pageId === 'developmentPage') {
        setTimeout(() => scrollToPageLanding(pageId, doc, win), 20);
        return;
      }
    }
    setTimeout(scrollNow, 0);
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

const navigationScrollApi = { scrollPageTop, configureScrollRestoration, resetNestedPageState, scrollToPageLanding, setupNavigationScroll };
if (typeof module !== 'undefined' && module.exports) module.exports = navigationScrollApi;
if (typeof window !== 'undefined') {
  window.KronangNavigationScroll = navigationScrollApi;
  if (typeof document !== 'undefined') setupNavigationScroll(document, window);
}
