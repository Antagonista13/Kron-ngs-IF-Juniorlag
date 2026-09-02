const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSubgoalSummaryViewModel } = require('../goal-summary.js');

test('builds subgoal progress for active and completed subgoals', () => {
  const model = buildSubgoalSummaryViewModel([
    { id: 'a', text: 'Första delmålet', status: 'active' },
    { id: 'b', text: 'Andra delmålet', status: 'completed' },
    { id: 'c', text: 'Arkiverat delmål', status: 'archived' }
  ]);

  assert.deepEqual(model, {
    items: [
      { id: 'a', text: 'Första delmålet', completed: false },
      { id: 'b', text: 'Andra delmålet', completed: true }
    ],
    progressText: '1 av 2 delmål klara'
  });
});

test('shows an empty subgoal state', () => {
  assert.deepEqual(buildSubgoalSummaryViewModel([]), {
    items: [],
    progressText: 'Inga delmål ännu'
  });
});
