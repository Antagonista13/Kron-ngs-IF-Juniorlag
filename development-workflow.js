const FOLLOW_UP_DAYS = 28;
const RECENT_ACTIVITY_DAYS = 7;

function toValidDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function needsDevelopmentFollowUp(lastFollowUpAt, nowValue) {
  if (!lastFollowUpAt) return true;
  const now = toValidDate(nowValue || Date.now());
  const last = toValidDate(lastFollowUpAt);
  if (!last || !now) return true;
  return now.getTime() - last.getTime() >= FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000;
}

function validateDevelopmentEntry(comment, visibility) {
  const text = (comment || '').trim();
  const allowed = visibility === 'player_visible' || visibility === 'leaders_only';
  if (!text) return { ok: false, message: 'Skriv en kommentar innan du sparar.' };
  if (!allowed) return { ok: false, message: 'Välj vem som ska kunna se anteckningen.' };
  return { ok: true, message: '' };
}

function validateGoalProposal(goalText) {
  return (goalText || '').trim()
    ? { ok: true, message: '' }
    : { ok: false, message: 'Skriv det mål du vill föreslå.' };
}

function rowTimestamp(row) {
  return row && (row.updated_at || row.resolved_at || row.created_at) || null;
}

function latestMeaningfulDevelopmentAt(groups) {
  const values = [];
  ['followUps', 'notes', 'goals', 'proposals'].forEach(function (key) {
    (groups && groups[key] || []).forEach(function (row) {
      const value = rowTimestamp(row);
      const date = toValidDate(value);
      if (date) values.push({ value: value, time: date.getTime() });
    });
  });
  if (!values.length) return null;
  values.sort(function (a, b) { return b.time - a.time; });
  return values[0].value;
}

function latestRow(rows, predicate) {
  return (rows || []).filter(function (row) { return !predicate || predicate(row); })
    .sort(function (a, b) {
      return (toValidDate(rowTimestamp(b)) || new Date(0)).getTime() - (toValidDate(rowTimestamp(a)) || new Date(0)).getTime();
    })[0] || null;
}

function buildDevelopmentRosterItem(player, goal, focus, followUps, notes, proposals, nowValue) {
  const latestFollowUp = latestRow(followUps, function (row) { return row.entry_type === 'follow_up'; });
  const lastFollowUpAt = latestFollowUp ? latestFollowUp.created_at : null;
  const meaningfulAt = latestMeaningfulDevelopmentAt({
    followUps: followUps || [],
    notes: notes || [],
    goals: goal ? [goal] : [],
    proposals: proposals || []
  });
  const now = toValidDate(nowValue || Date.now()) || new Date();
  const meaningfulDate = toValidDate(meaningfulAt);
  const recentlyUpdated = Boolean(meaningfulDate && now.getTime() - meaningfulDate.getTime() <= RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  return {
    id: player.id,
    name: player.full_name || 'Namnlös spelare',
    shirtNumber: player.shirt_number == null ? null : player.shirt_number,
    number: player.shirt_number == null ? null : player.shirt_number,
    goal: goal && goal.title ? goal.title : 'Inget aktivt mål',
    focus: focus && focus.focus_text ? focus.focus_text : 'Inget aktivt fokus',
    hasGoal: Boolean(goal && goal.title),
    hasFocus: Boolean(focus && focus.focus_text),
    lastFollowUpAt: lastFollowUpAt,
    needsFollowUp: needsDevelopmentFollowUp(lastFollowUpAt, now),
    meaningfulActivityAt: meaningfulAt,
    recentlyUpdated: recentlyUpdated
  };
}

function filterDevelopmentRosterItems(items, query, filter) {
  const normalizedQuery = (query || '').trim().toLocaleLowerCase('sv');
  const activeFilter = filter || 'all';
  return (items || []).filter(function (item) {
    const matchesName = !normalizedQuery || (item.name || '').toLocaleLowerCase('sv').includes(normalizedQuery);
    if (!matchesName) return false;
    if (activeFilter === 'needs-follow-up') return Boolean(item.needsFollowUp);
    if (activeFilter === 'missing-goal') return !item.hasGoal;
    if (activeFilter === 'recent') return Boolean(item.recentlyUpdated);
    return true;
  });
}

const api = {
  FOLLOW_UP_DAYS,
  RECENT_ACTIVITY_DAYS,
  needsDevelopmentFollowUp,
  latestMeaningfulDevelopmentAt,
  buildDevelopmentRosterItem,
  filterDevelopmentRosterItems,
  validateDevelopmentEntry,
  validateGoalProposal
};

if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.KronangDevelopmentWorkflow = api;
