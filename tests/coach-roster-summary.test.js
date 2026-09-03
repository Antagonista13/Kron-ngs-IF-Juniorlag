const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachRosterSummary, formatRosterAssessmentDate, filterCoachRosterItems, buildCoachRosterStatus, buildCoachTeamOverview } = require('../coach-roster-summary.js');

test('builds a compact coach roster summary for each player', () => {
  const players = [{ id: 'p1', full_name: 'Testspelare' }, { id: 'p2', full_name: 'Anna Andersson' }];
  const goals = [{ player_id: 'p1', title: 'Bli bättre skytt', status: 'active', created_at: '2026-09-02T08:00:00Z' }];
  const focuses = [{ player_id: 'p1', focus_text: 'Bättre första touch', lifecycle_status: 'active', created_at: '2026-09-02T09:00:00Z' }];
  const assessments = [{ player_id: 'p1', technique_coach: 3, game_understanding_coach: 3, physical_coach: 5, mentality_coach: 4, created_at: '2026-09-02T07:50:00Z' }];
  assert.equal(buildCoachRosterSummary(players, goals, focuses, assessments).length, 2);
});

test('builds a neutral team overview without ranking players', () => {
  const items = [
    { hasGoal: true, hasFocus: true, hasAssessment: true },
    { hasGoal: true, hasFocus: false, hasAssessment: false },
    { hasGoal: false, hasFocus: true, hasAssessment: false }
  ];
  assert.deepEqual(buildCoachTeamOverview(items), { total: 3, activeGoals: 2, activeFocuses: 2, assessed: 1, missingGoals: 1, missingFocuses: 1, missingAssessments: 2 });
});

test('filters roster by name and status', () => {
  const items = [
    { id: 'p1', name: 'Anna Andersson', hasGoal: false, hasFocus: true, hasAssessment: true },
    { id: 'p2', name: 'Erik Berg', hasGoal: true, hasFocus: false, hasAssessment: true },
    { id: 'p3', name: 'Testspelare', hasGoal: true, hasFocus: true, hasAssessment: false }
  ];
  assert.deepEqual(filterCoachRosterItems(items, '', 'missing-goal'), [items[0]]);
  assert.deepEqual(filterCoachRosterItems(items, '', 'missing-focus'), [items[1]]);
  assert.deepEqual(filterCoachRosterItems(items, '', 'missing-assessment'), [items[2]]);
  assert.deepEqual(filterCoachRosterItems(items, 'erik', 'missing-focus'), [items[1]]);
  assert.deepEqual(filterCoachRosterItems(items, 'anna', 'missing-focus'), []);
  assert.deepEqual(filterCoachRosterItems(items, '', 'all'), items);
});

test('formats date and status', () => {
  assert.equal(formatRosterAssessmentDate('2026-09-02T07:50:00Z'), '2 september 2026');
  assert.equal(buildCoachRosterStatus(true, false, false), 'Mål ✓ · Fokus saknas · Bedömning saknas');
});
