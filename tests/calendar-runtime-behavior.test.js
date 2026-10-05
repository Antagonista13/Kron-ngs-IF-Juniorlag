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

function app(time, { failFirstFetch = false, feedText = feed } = {}) {
  let now = new Date(time).getTime(), offline = false;
  let requests = 0;
  const home = { innerHTML: '' }, calendar = { innerHTML: '' };
  const calendarPage = { classList: { contains: () => false } };
  const events = {}, documentEvents = {}, saved = new Map();
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
      getElementById: id => id === 'nextActivityHome' ? home : id === 'calendarList' ? calendar : id === 'calendarPage' ? calendarPage : null,
      querySelector: () => null,
      addEventListener(name, fn) { documentEvents[name] = fn; },
      dispatchEvent() {}
    },
    CustomEvent: class {},
    fetch: async () => { requests++; if (offline || (failFirstFetch && requests === 1)) throw new Error('offline'); return { ok: true, text: async () => feedText }; },
    setInterval(fn) { events.minute = fn; }
  });
  vm.runInContext(fs.readFileSync('calendar-management.js', 'utf8'), context);
  // Only replace the remote hidden-events lookup, keeping the actual filters and renderers.
  window.KronangCalendarManagement.loadHiddenCalendarKeys = async () => [];
  vm.runInContext(fs.readFileSync('calendar-runtime.js', 'utf8'), context);
  vm.runInContext(fs.readFileSync('calendar-bridge.js', 'utf8'), context);
  return {
    home, calendar, calendarPage, window, events, documentEvents, context,
    setTime(value) { now = new Date(value).getTime(); },
    goOffline() { offline = true; },
    clearCache() { saved.clear(); },
    requestCount() { return requests; },
    async settle() { await new Promise(resolve => setImmediate(resolve)); }
  };
}

test('opening Calendar repairs a failed Home fetch using the successful feed without another request', async () => {
  const a = app('2026-10-02T17:00:00+02:00', { failFirstFetch: true });
  await a.settle();
  assert.match(a.home.innerHTML, /Kalendern kunde inte laddas/);
  await a.window.testSportAdminCalendar();
  assert.match(a.calendar.innerHTML, /Fredagsträning/);
  assert.match(a.home.innerHTML, /Fredagsträning/);
  assert.equal(a.requestCount(), 2);
  a.goOffline();
  a.setTime('2026-10-03T07:00:00+02:00');
  a.events.focus();
  await a.settle();
  assert.match(a.home.innerHTML, /Söndagsmatch/);
  assert.doesNotMatch(a.home.innerHTML, /Fredagsträning/);
});

test('Calendar still renders when Home cannot process the successful feed', async () => {
  const a = app('2026-10-02T17:00:00+02:00');
  await a.settle();
  delete a.window.KronangCalendarManagement;
  await a.window.loadNextActivityHome();
  assert.match(a.home.innerHTML, /Kalendern kunde inte laddas/);
  await a.window.testSportAdminCalendar();
  assert.match(a.calendar.innerHTML, /Fredagsträning/);
});

test('Calendar displays activities while the Home update is waiting', async () => {
  const a = app('2026-10-02T17:00:00+02:00');
  await a.settle();
  let release;
  a.window.updateCalendarFromFeed = () => new Promise(resolve => { release = resolve; });
  const rendering = a.window.testSportAdminCalendar();
  await a.settle();
  try { assert.match(a.calendar.innerHTML, /Fredagsträning/); }
  finally { release(); await rendering; }
});

test('a successful empty Calendar feed clears the Home error without fetching again', async () => {
  const a = app('2026-10-02T17:00:00+02:00', {
    failFirstFetch: true, feedText: 'BEGIN:VCALENDAR\nEND:VCALENDAR'
  });
  await a.settle();
  assert.match(a.home.innerHTML, /Kalendern kunde inte laddas/);
  await a.window.testSportAdminCalendar();
  assert.match(a.calendar.innerHTML, /Inga kommande aktiviteter/);
  assert.match(a.home.innerHTML, /Ingen kommande aktivitet/);
  assert.equal(a.requestCount(), 2);
});

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
