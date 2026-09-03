const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachComparisonModel, shouldWaitForCoachAssessmentRender } = require('../coach-comparison.js');

test('compares current coach ratings with the immediately previous coach-rated assessment', () => {
  const rows = [
    { technique_coach: 4, game_understanding_coach: 3, physical_coach: 5, mentality_coach: 4 },
    { technique_coach: 3, game_understanding_coach: 3, physical_coach: 4, mentality_coach: 2 },
    { technique_coach: 1, game_understanding_coach: 1, physical_coach: 1, mentality_coach: 1 }
  ];

  assert.deepEqual(buildCoachComparisonModel(rows), [
    { label: 'Teknik', current: 4, previous: 3 },
    { label: 'Spelförståelse', current: 3, previous: 3 },
    { label: 'Fys', current: 5, previous: 4 },
    { label: 'Mentalitet', current: 4, previous: 2 }
  ]);
});

test('skips an older self-assessment row that has no coach ratings', () => {
  const rows = [
    { technique_coach: 3, game_understanding_coach: 3, physical_coach: 5, mentality_coach: 4 },
    { technique_coach: null, game_understanding_coach: null, physical_coach: null, mentality_coach: null },
    { technique_coach: 3, game_understanding_coach: 4, physical_coach: 4, mentality_coach: 3 }
  ];

  assert.deepEqual(buildCoachComparisonModel(rows), [
    { label: 'Teknik', current: 3, previous: 3 },
    { label: 'Spelförståelse', current: 3, previous: 4 },
    { label: 'Fys', current: 5, previous: 4 },
    { label: 'Mentalitet', current: 4, previous: 3 }
  ]);
});

test('returns no comparison when there is no previous coach-rated assessment', () => {
  assert.deepEqual(buildCoachComparisonModel([
    { technique_coach: 4 },
    { technique_coach: null }
  ]), []);
});

test('waits until the main coach assessment has finished rendering', () => {
  assert.equal(shouldWaitForCoachAssessmentRender(false, 0), true);
  assert.equal(shouldWaitForCoachAssessmentRender(false, 29), true);
  assert.equal(shouldWaitForCoachAssessmentRender(false, 30), false);
  assert.equal(shouldWaitForCoachAssessmentRender(true, 0), false);
});
