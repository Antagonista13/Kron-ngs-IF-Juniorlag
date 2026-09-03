const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachComparisonModel, shouldWaitForCoachAssessmentRender, hasCoachRating, assessmentChangeLabel } = require('../coach-comparison.js');

test('compares current coach ratings with the immediately previous complete coach assessment', () => {
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

test('skips mixed or incomplete rows between two complete coach assessments', () => {
  const rows = [
    { technique_coach: 3, game_understanding_coach: 3, physical_coach: 5, mentality_coach: 4 },
    { technique_coach: null, game_understanding_coach: 2, physical_coach: null, mentality_coach: null },
    { technique_coach: 3, game_understanding_coach: 4, physical_coach: 4, mentality_coach: 3 }
  ];

  assert.deepEqual(buildCoachComparisonModel(rows), [
    { label: 'Teknik', current: 3, previous: 3 },
    { label: 'Spelförståelse', current: 3, previous: 4 },
    { label: 'Fys', current: 5, previous: 4 },
    { label: 'Mentalitet', current: 4, previous: 3 }
  ]);
});

test('a coach assessment counts only when all four coach ratings exist', () => {
  assert.equal(hasCoachRating({ technique_coach: 3, game_understanding_coach: 3, physical_coach: 4, mentality_coach: 3 }), true);
  assert.equal(hasCoachRating({ technique_coach: null, game_understanding_coach: 3, physical_coach: null, mentality_coach: null }), false);
});

test('returns no comparison when there is no previous complete coach assessment', () => {
  assert.deepEqual(buildCoachComparisonModel([
    { technique_coach: 4, game_understanding_coach: 3, physical_coach: 4, mentality_coach: 4 },
    { technique_coach: null, game_understanding_coach: 3, physical_coach: null, mentality_coach: null }
  ]), []);
});

test('waits until the main coach assessment has finished rendering', () => {
  assert.equal(shouldWaitForCoachAssessmentRender(false, 0), true);
  assert.equal(shouldWaitForCoachAssessmentRender(false, 29), true);
  assert.equal(shouldWaitForCoachAssessmentRender(false, 30), false);
  assert.equal(shouldWaitForCoachAssessmentRender(true, 0), false);
});

test('describes rating change without judging it', () => {
  assert.equal(assessmentChangeLabel(4, 3), '+1');
  assert.equal(assessmentChangeLabel(3, 4), '−1');
  assert.equal(assessmentChangeLabel(3, 3), 'Oförändrat');
  assert.equal(assessmentChangeLabel(5, 3), '+2');
});
