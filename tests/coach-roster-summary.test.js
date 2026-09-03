const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachRosterSummary, formatRosterAssessmentDate, filterCoachRosterItems } = require('../coach-roster-summary.js');

test('builds a compact coach roster summary for each player', () => {
  const players = [
    { id: 'p1', full_name: 'Testspelare' },
    { id: 'p2', full_name: 'Anna Andersson' }
  ];
  const goals = [
    { player_id: 'p1', title: 'Bli bättre skytt', status: 'active', created_at: '2026-09-02T08:00:00Z' }
  ];
  const focuses = [
    { player_id: 'p1', focus_text: 'Bättre första touch', lifecycle_status: 'active', created_at: '2026-09-02T09:00:00Z' }
  ];
  const assessments = [
    { player_id: 'p1', technique_coach: 3, game_understanding_coach: 3, physical_coach: 5, mentality_coach: 4, created_at: '2026-09-02T07:50:00Z' }
  ];

  assert.deepEqual(buildCoachRosterSummary(players, goals, focuses, assessments), [
    {
      id: 'p2',
      name: 'Anna Andersson',
      goal: 'Inget aktivt mål',
      focus: 'Inget aktivt fokus',
      latestAssessment: 'Ingen tränarbedömning'
    },
    {
      id: 'p1',
      name: 'Testspelare',
      goal: 'Bli bättre skytt',
      focus: 'Bättre första touch',
      latestAssessment: '2 september 2026'
    }
  ]);
});

test('ignores self-assessment-only rows when finding latest trainer assessment', () => {
  const assessments = [
    { player_id: 'p1', technique_coach: null, game_understanding_coach: null, physical_coach: null, mentality_coach: null, created_at: '2026-09-03T10:00:00Z' },
    { player_id: 'p1', technique_coach: 3, game_understanding_coach: 4, physical_coach: 4, mentality_coach: 3, created_at: '2026-09-02T07:28:00Z' }
  ];
  const result = buildCoachRosterSummary([{ id: 'p1', full_name: 'Testspelare' }], [], [], assessments);
  assert.equal(result[0].latestAssessment, '2 september 2026');
});

test('formats roster assessment dates in Swedish', () => {
  assert.equal(formatRosterAssessmentDate('2026-09-02T07:50:00Z'), '2 september 2026');
});

test('filters coach roster by player name without caring about case or extra spaces', () => {
  const items = [
    { id: 'p1', name: 'Anna Andersson' },
    { id: 'p2', name: 'Erik Berg' },
    { id: 'p3', name: 'Testspelare' }
  ];

  assert.deepEqual(filterCoachRosterItems(items, '  ANNA '), [items[0]]);
  assert.deepEqual(filterCoachRosterItems(items, 'berg'), [items[1]]);
  assert.deepEqual(filterCoachRosterItems(items, ''), items);
});
