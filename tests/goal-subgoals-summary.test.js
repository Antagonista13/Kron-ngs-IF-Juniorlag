const test = require('node:test');
const assert = require('node:assert/strict');
const goalSummary = require('../goal-summary.js');
const { buildSubgoalSummaryViewModel } = goalSummary;

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

test('builds the RPC request for completing and reopening a subgoal', () => {
  assert.equal(typeof goalSummary.buildSubgoalToggleRequest, 'function');
  assert.deepEqual(goalSummary.buildSubgoalToggleRequest({ id: 'abc', completed: false }), { p_subgoal_id: 'abc', p_completed: true });
  assert.deepEqual(goalSummary.buildSubgoalToggleRequest({ id: 'abc', completed: true }), { p_subgoal_id: 'abc', p_completed: false });
});

test('builds the RPC request for adding a trimmed subgoal', () => {
  assert.equal(typeof goalSummary.buildSubgoalCreateRequest, 'function');
  assert.deepEqual(goalSummary.buildSubgoalCreateRequest('goal-1', '  Titta upp innan mottagning.  '), { p_goal_id: 'goal-1', p_text: 'Titta upp innan mottagning.' });
});

test('builds the RPC request for archiving a subgoal', () => {
  assert.equal(typeof goalSummary.buildSubgoalArchiveRequest, 'function');
  assert.deepEqual(goalSummary.buildSubgoalArchiveRequest({ id: 'subgoal-1' }), { p_subgoal_id: 'subgoal-1' });
});

test('builds the RPC request for completing a goal with trimmed reflection', () => {
  assert.equal(typeof goalSummary.buildGoalCompleteRequest, 'function');
  assert.deepEqual(goalSummary.buildGoalCompleteRequest('goal-1', '  Jag har lärt mig att läsa spelet bättre.  '), { p_goal_id: 'goal-1', p_final_reflection: 'Jag har lärt mig att läsa spelet bättre.' });
});

test('completion mode replaces the normal goal controls', () => {
  assert.equal(typeof goalSummary.buildGoalCompletionViewModel, 'function');
  assert.deepEqual(
    goalSummary.buildGoalCompletionViewModel(
      { title: 'Bli bättre på mitt beslutsfattande' },
      [{ status: 'completed' }, { status: 'active' }]
    ),
    {
      heading: 'Avsluta mål',
      goalTitle: 'Bli bättre på mitt beslutsfattande',
      progressText: '1 av 2 delmål klara',
      question: 'Vad har du lärt dig och vad gjorde att du nådde målet?'
    }
  );
});
