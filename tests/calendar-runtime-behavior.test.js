const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// SportAdmin dates are local club times; keep fixtures independent of the CI host.
process.env.TZ = 'Europe/Stockholm';

const feed = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:friday
DTSTART:20261002T180000
DTEND:20261002T200000
SUMMARY:Fredagsträning
END:VEVENT
BEGIN:VEVENT
UID:sunday
DTSTART:20261004T120000
DTEND:20261004T140000
SUMMARY:Söndagsmatch
END:VEVENT
END:VCALENDAR`;

function app(time, withLegacyStartup = false, initialOffline = false, initialFailures = 0) {
  let now = new Date(time).getTime(), offline = initialOffline, nextFetch, failures = initialFailures, requests = 0;
  const home = { innerHTML: '' }, calendar = { innerHTML: '' };
  const calendarPage = { classList: { contains: () => false } };
  const events = {}, documentEvents = {}, saved = new Map();
  let rejectLegacy;
  const NativeDate = Date;
  class ClockDate extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const window = { addEventListener(name, fn) { events[name] = fn; } };
  const context = vm.createContext({
    window, Date: ClockDate, console: { warn() {}, error() {} },
    localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
    document: {
      visibilityState: 'visible',
      readyState: 'loading',
      getElementById: id => id === 'nextActivityHome' ? home : id === 'calendarList' ? calendar : id === 'calendarPage' ? calendarPage : null,
      querySelector: () => null,
      addEventListener(name, fn) { documentEvents[name] = fn; },
      dispatchEvent() {}
    },
    CustomEvent: class {},
    fetch: async url => { requests++; if (failures > 0) { failures--; throw new Error('startup connection unavailable'); } if (nextFetch) { const result = nextFetch; nextFetch = null; return result; } if (withLegacyStartup && !url.includes('?')) return new Promise((resolve, reject) => { rejectLegacy = reject; }); if (offline) throw new Error('offline'); return { ok: true, text: async () => feed }; },
    setInterval(fn) { events.minute = fn; },
    setTimeout(fn) { queueMicrotask(fn); }
  });
  // These classic scripts share one browser scope in the real app.
  vm.runInContext(fs.readFileSync('leader-tools-profile.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('calendar-management.js', 'utf8'), context);
  // Only replace the remote hidden-events lookup, keeping the actual filters and renderers.
  window.KronangCalendarManagement.loadHiddenCalendarKeys = async () => [];
  if (withLegacyStartup) {
    const script = fs.readFileSync('script.js', 'utf8');
    const start = script.indexOf('/* =========================\n   NÄSTA AKTIVITET - STARTSIDA');
    const end = script.indexOf('const SUPABASE_URL', start);
    vm.runInContext(script.slice(start, end), context);
  }
  vm.runInContext(fs.readFileSync('calendar-runtime.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('calendar-bridge.js', 'utf8'), context);
  return {
    home, calendar, calendarPage, window, events, documentEvents, context,
    requestCount() { return requests; },
    failLegacy() { if (rejectLegacy) rejectLegacy(new Error("late legacy failure")); },
    setTime(value) { now = new Date(value).getTime(); },
    goOffline() { offline = true; },
    goOnline() { offline = false; },
    holdNextFetch(promise) { nextFetch = promise; },
    clearCache() { saved.clear(); },
    async settle() { await new Promise(resolve => setImmediate(resolve)); }
  };
}

test('Home and Calendar both keep an ongoing activity until its end', async () => {
  const a = app('2026-10-02T19:00:00+02:00');
  await a.settle();
  await a.window.testSportAdminCalendar();
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.match(a.calendar.innerHTML, /Fredagsträning/);
  a.setTime('2026-10-02T20:01:00+02:00');
  await a.window.loadNextActivityHome();
  await a.window.testSportAdminCalendar();
  for (const host of [a.home, a.calendar]) {
    assert.doesNotMatch(host.innerHTML, /Fredagsträning/);
    assert.match(host.innerHTML, /Söndagsmatch/);
  }
});

for (const event of ['pageshow', 'focus', 'minute', 'visibilitychange']) {
  test(`Home drops yesterday's activity on ${event}`, async () => {
    const a = app('2026-10-02T19:00:00+02:00');
    await a.settle();
    assert.match(a.home.innerHTML, /Fredagsträning/);
    a.setTime('2026-10-03T07:00:00+02:00');
    (event === 'visibilitychange' ? a.documentEvents[event] : a.events[event])();
    await a.settle();
    assert.doesNotMatch(a.home.innerHTML, /Fredagsträning/);
    assert.match(a.home.innerHTML, /Söndagsmatch/);
  });
  test(`an open Calendar drops completed activities on ${event}`, async () => {
    const a = app('2026-10-02T19:00:00+02:00');
    await a.settle();
    a.calendarPage.classList.contains = value => value === 'active';
    await a.window.testSportAdminCalendar();
    assert.match(a.calendar.innerHTML, /Fredagsträning/);
    a.setTime('2026-10-03T07:00:00+02:00');
    (event === 'visibilitychange' ? a.documentEvents[event] : a.events[event])();
    await a.settle();
    assert.doesNotMatch(a.calendar.innerHTML, /Fredagsträning/);
    assert.match(a.calendar.innerHTML, /Söndagsmatch/);
  });
}

test('offline cache removes completed activities and failure never leaves old Home HTML', async () => {
  const a = app('2026-10-02T19:00:00+02:00');
  await a.settle();
  a.setTime('2026-10-05T07:00:00+02:00');
  a.goOffline();
  a.events.focus();
  await a.settle();
  assert.match(a.home.innerHTML, /Ingen kommande aktivitet/);
  assert.doesNotMatch(a.home.innerHTML, /Fredagsträning|Söndagsmatch/);
  a.clearCache();
  a.events.focus();
  await a.settle();
  assert.match(a.home.innerHTML, /Kalendern kunde inte laddas/);
});

test('a late legacy startup failure cannot overwrite a successful Home calendar', async () => {
  const a = app('2026-10-02T19:00:00+02:00', true);
  await a.settle();
  assert.match(a.home.innerHTML, /Fredagsträning/);
  a.failLegacy();
  await a.settle();
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.doesNotMatch(a.home.innerHTML, /Kalendern kunde inte laddas/);
});


test('opening Calendar repairs a failed Home using the successful calendar feed', async () => {
  const a = app('2026-10-02T19:00:00+02:00', false, true);
  await a.settle();
  assert.match(a.home.innerHTML, /Kalendern kunde inte laddas/);
  a.goOnline();
  await a.window.testSportAdminCalendar();
  await a.settle();
  assert.match(a.calendar.innerHTML, /Fredagsträning/);
  assert.match(a.home.innerHTML, /Fredagsträning/);
  // The recovered feed must also be saved for the next offline refresh.
  a.goOffline();
  a.events.focus();
  await a.settle();
  assert.match(a.home.innerHTML, /Fredagsträning/);
});

test('a pending Home failure cannot replace the feed recovered by Calendar', async () => {
  const a = app('2026-10-02T19:00:00+02:00', false, true);
  await a.settle();
  a.goOnline();
  let reject;
  a.holdNextFetch(new Promise((resolve, fail) => { reject = fail; }));
  const pendingHome = a.window.loadNextActivityHome();
  await a.window.testSportAdminCalendar();
  await a.settle();
  a.clearCache();
  reject(new Error('delayed startup failure'));
  await pendingHome;
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.doesNotMatch(a.home.innerHTML, /Kalendern kunde inte laddas/);
});


test('Calendar remains readable if the optional Home update fails', async () => {
  const a = app('2026-10-02T19:00:00+02:00');
  await a.settle();
  a.window.acceptCalendarFeed = async () => { throw new Error('Home unavailable'); };
  await a.window.testSportAdminCalendar();
  await a.settle();
  assert.match(a.calendar.innerHTML, /Fredagsträning/);
});

test('Home recovery still excludes hidden activities from the shared feed', async () => {
  const a = app('2026-10-02T19:00:00+02:00', false, true);
  await a.settle();
  a.window.KronangCalendarManagement.loadHiddenCalendarKeys = async () => ['uid:friday'];
  a.goOnline();
  await a.window.testSportAdminCalendar();
  await a.settle();
  assert.doesNotMatch(a.home.innerHTML, /Fredagsträning/);
  assert.match(a.home.innerHTML, /Söndagsmatch/);
});


test('Home automatically recovers from temporary startup fetch failures', async () => {
  const a = app('2026-10-02T19:00:00+02:00', false, false, 2);
  await a.settle();
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.doesNotMatch(a.home.innerHTML, /Kalendern kunde inte laddas/);
  assert.equal(a.requestCount(), 3);
});

test('simultaneous startup lifecycle events share the retrying calendar request', async () => {
  const a = app('2026-10-02T19:00:00+02:00', false, false, 2);
  a.events.pageshow();
  a.events.focus();
  await a.settle();
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.equal(a.requestCount(), 3);
});

test('startup retries stop and show an error when the connection stays unavailable', async () => {
  const a = app('2026-10-02T19:00:00+02:00', false, true);
  await a.settle();
  assert.match(a.home.innerHTML, /Kalendern kunde inte laddas/);
  assert.equal(a.requestCount(), 3);
});


test('startup lifecycle events do not start duplicate successful feed requests', async () => {
  const a = app('2026-10-02T19:00:00+02:00');
  a.events.pageshow();
  a.events.focus();
  await a.settle();
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.equal(a.requestCount(), 1);
});
