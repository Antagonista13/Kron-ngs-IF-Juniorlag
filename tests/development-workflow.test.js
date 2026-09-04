const test = require('node:test');
const assert = require('node:assert/strict');
const {
  needsDevelopmentFollowUp,
  latestMeaningfulDevelopmentAt,
  buildDevelopmentRosterItem,
  filterDevelopmentRosterItems,
  buildLeaderDashboardSummary,
  validateDevelopmentEntry,
  validateGoalProposal
} = require('../development-workflow.js');

test('follow-up becomes due at exactly 28 days', () => {
  const now = new Date('2026-09-04T12:00:00Z');
  assert.equal(needsDevelopmentFollowUp('2026-08-07T12:00:00Z', now), true);
  assert.equal(needsDevelopmentFollowUp('2026-08-08T12:00:01Z', now), false);
});

test('missing follow-up is treated as needing follow-up without inventing a date', () => {
  assert.equal(needsDevelopmentFollowUp(null, new Date('2026-09-04T12:00:00Z')), true);
});

test('worklist filters follow-up and missing goal states', () => {
  const items = [
    { id: '1', name: 'Anna', needsFollowUp: true, hasGoal: true, recentlyUpdated: false },
    { id: '2', name: 'Bertil', needsFollowUp: false, hasGoal: false, recentlyUpdated: true }
  ];
  assert.deepEqual(filterDevelopmentRosterItems(items, '', 'needs-follow-up').map(x => x.id), ['1']);
  assert.deepEqual(filterDevelopmentRosterItems(items, '', 'missing-goal').map(x => x.id), ['2']);
  assert.deepEqual(filterDevelopmentRosterItems(items, '', 'recent').map(x => x.id), ['2']);
});

test('leader dashboard summarizes players and current development states', () => {
  const items = [
    { id: '1', needsFollowUp: true, hasGoal: true, hasFocus: true, recentlyUpdated: true },
    { id: '2', needsFollowUp: false, hasGoal: false, hasFocus: true, recentlyUpdated: false },
    { id: '3', needsFollowUp: true, hasGoal: true, hasFocus: false, recentlyUpdated: true }
  ];
  assert.deepEqual(buildLeaderDashboardSummary(items), {
    totalPlayers: 3,
    needsFollowUp: 2,
    activeGoals: 2,
    activeFocuses: 2,
    recentlyUpdated: 2
  });
});

test('registered development entry requires text and exact visibility', () => {
  assert.equal(validateDevelopmentEntry('', 'player_visible').ok, false);
  assert.equal(validateDevelopmentEntry('Bra arbete', 'unknown').ok, false);
  assert.equal(validateDevelopmentEntry('Bra arbete', 'leaders_only').ok, true);
});

test('goal proposal requires non-empty text', () => {
  assert.equal(validateGoalProposal('   ').ok, false);
  assert.equal(validateGoalProposal('Spela snabbare på få tillslag').ok, true);
});

test('latest meaningful activity considers all development sources', () => {
  const latest = latestMeaningfulDevelopmentAt({
    followUps: [{created_at:'2026-08-01T10:00:00Z'}],
    notes: [{created_at:'2026-08-20T10:00:00Z'}],
    goals: [{updated_at:'2026-08-15T10:00:00Z'}],
    proposals: [{created_at:'2026-08-22T10:00:00Z'}]
  });
  assert.equal(latest, '2026-08-22T10:00:00Z');
});

test('roster item derives latest registered follow-up and due state', () => {
  const item = buildDevelopmentRosterItem(
    { id: 'p1', full_name: 'Testspelare', shirt_number: 10 },
    { title: 'Spela framåt', status: 'active', created_at: '2026-09-01T10:00:00Z' },
    { focus_text: 'Första touch', lifecycle_status: 'active', created_at: '2026-09-02T10:00:00Z' },
    [{ player_id: 'p1', entry_type: 'follow_up', created_at: '2026-08-01T10:00:00Z' }],
    [],
    [],
    new Date('2026-09-04T10:00:00Z')
  );
  assert.equal(item.shirtNumber, 10);
  assert.equal(item.needsFollowUp, true);
  assert.equal(item.lastFollowUpAt, '2026-08-01T10:00:00Z');
});
