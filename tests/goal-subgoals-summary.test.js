const test = require('node:test');
const assert = require('node:assert/strict');
const goalSummary = require('../goal-summary.js');
const approvedGoal = require('../approved-leader-goal.js');
const { buildSubgoalSummaryViewModel } = goalSummary;

test('builds subgoal progress for active and completed subgoals', () => {
  const model = buildSubgoalSummaryViewModel([{ id: 'a', text: 'Första delmålet', status: 'active' },{ id: 'b', text: 'Andra delmålet', status: 'completed' },{ id: 'c', text: 'Arkiverat delmål', status: 'archived' }]);
  assert.deepEqual(model, { items: [{ id: 'a', text: 'Första delmålet', completed: false }, { id: 'b', text: 'Andra delmålet', completed: true }], progressText: '1 av 2 delmål klara' });
});
test('shows an empty subgoal state', () => { assert.deepEqual(buildSubgoalSummaryViewModel([]), { items: [], progressText: 'Inga delmål ännu' }); });
test('builds the RPC request for completing and reopening a subgoal', () => { assert.deepEqual(goalSummary.buildSubgoalToggleRequest({ id: 'abc', completed: false }), { p_subgoal_id: 'abc', p_completed: true }); assert.deepEqual(goalSummary.buildSubgoalToggleRequest({ id: 'abc', completed: true }), { p_subgoal_id: 'abc', p_completed: false }); });
test('builds the RPC request for adding a trimmed subgoal', () => { assert.deepEqual(goalSummary.buildSubgoalCreateRequest('goal-1', '  Titta upp innan mottagning.  '), { p_goal_id: 'goal-1', p_text: 'Titta upp innan mottagning.' }); });
test('builds the RPC request for archiving a subgoal', () => { assert.deepEqual(goalSummary.buildSubgoalArchiveRequest({ id: 'subgoal-1' }), { p_subgoal_id: 'subgoal-1' }); });
test('builds the RPC request for completing a goal with trimmed reflection', () => { assert.deepEqual(goalSummary.buildGoalCompleteRequest('goal-1', '  Jag har lärt mig att läsa spelet bättre.  '), { p_goal_id: 'goal-1', p_final_reflection: 'Jag har lärt mig att läsa spelet bättre.' }); });
test('completion mode replaces the normal goal controls', () => { assert.deepEqual(goalSummary.buildGoalCompletionViewModel({ title: 'Bli bättre på mitt beslutsfattande' }, [{ status: 'completed' }, { status: 'active' }]), { heading: 'Avsluta mål', goalTitle: 'Bli bättre på mitt beslutsfattande', progressText: '1 av 2 delmål klara', question: 'Vad har du lärt dig och vad gjorde att du nådde målet?' }); });
test('builds goal history with completed goals and saved subgoals', () => { assert.equal(typeof goalSummary.buildGoalHistoryViewModel, 'function'); assert.deepEqual(goalSummary.buildGoalHistoryViewModel([{ id: 'goal-1', title: 'Mitt gamla mål', final_reflection: 'Jag lärde mig mycket.', completed_at: '2026-09-02T12:00:00Z' }], { 'goal-1': [{ id: 'sub-1', text: 'Första delmålet', status: 'completed' }, { id: 'sub-2', text: 'Arkiverat', status: 'archived' }] }), [{ id: 'goal-1', title: 'Mitt gamla mål', reflection: 'Jag lärde mig mycket.', completedAt: '2026-09-02T12:00:00Z', subgoals: [{ id: 'sub-1', text: 'Första delmålet', completed: true }] }]); });
test('approved leader goal gets a compact confirmation label only when it matches an accepted proposal', () => { assert.deepEqual(approvedGoal.buildApprovedLeaderGoalPresentation({ title: 'Stretcha' }, [{ status: 'accepted', proposed_goal_text: 'Stretcha' }]), { approvedFromLeader: true, label: 'GODKÄNT FRÅN DIN LEDARE', className: 'approved-leader-goal' }); assert.deepEqual(approvedGoal.buildApprovedLeaderGoalPresentation({ title: 'Eget mål' }, [{ status: 'accepted', proposed_goal_text: 'Stretcha' }]), { approvedFromLeader: false, label: '', className: '' }); });
