const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachAssessmentHistoryModel } = require('../coach-history.js');

test('keeps current assessment separate and returns at most three previous assessments', () => {
  const rows = [
    { id: 'new', created_at: '2026-09-03T08:00:00Z' },
    { id: 'old-1', created_at: '2026-08-01T08:00:00Z' },
    { id: 'old-2', created_at: '2026-07-01T08:00:00Z' },
    { id: 'old-3', created_at: '2026-06-01T08:00:00Z' },
    { id: 'old-4', created_at: '2026-05-01T08:00:00Z' }
  ];

  assert.deepEqual(
    buildCoachAssessmentHistoryModel(rows).map(row => row.id),
    ['old-1', 'old-2', 'old-3']
  );
});
