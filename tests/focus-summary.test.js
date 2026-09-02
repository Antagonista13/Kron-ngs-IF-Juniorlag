const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFocusSummaryViewModel, buildCompleteFocusRequest, buildFocusHistoryViewModel } = require('../focus-summary.js');

test('builds a Swedish read-only focus summary with latest coach feedback', () => {
  const model = buildFocusSummaryViewModel({
    development_area: 'game_understanding',
    focus_text: 'Läsa spelet snabbare',
    attention_text: 'Titta upp innan mottagning',
    follow_up_status: 'following_up'
  }, {
    comment: 'Bra utveckling. Fortsätt att titta upp innan du får bollen.'
  });

  assert.deepEqual(model, {
    empty: false,
    areaLabel: 'Spelförståelse',
    focusText: 'Läsa spelet snabbare',
    attentionText: 'Titta upp innan mottagning',
    statusLabel: 'Följs upp',
    coachFeedback: 'Bra utveckling. Fortsätt att titta upp innan du får bollen.',
    canComplete: false
  });
});

test('allows player completion only after coach follow-up is complete', () => {
  const model = buildFocusSummaryViewModel({
    development_area: 'game_understanding',
    focus_text: 'Läsa spelet snabbare',
    attention_text: 'Titta upp innan mottagning',
    follow_up_status: 'follow_up_complete'
  }, null);
  assert.equal(model.canComplete, true);
});

test('builds a trimmed focus completion RPC request', () => {
  assert.deepEqual(buildCompleteFocusRequest('focus-1', '  Jag tittar upp tidigare.  '), {
    p_focus_id: 'focus-1',
    p_end_reflection: 'Jag tittar upp tidigare.'
  });
});

test('builds focus history with player reflection and coach feedback', () => {
  const model = buildFocusHistoryViewModel([
    {
      id: 'focus-1',
      development_area: 'game_understanding',
      focus_text: 'Läsa spelet snabbare',
      attention_text: 'Titta upp innan mottagning',
      player_reflection: 'Jag ser alternativen tidigare nu.',
      ended_at: '2026-09-02T12:00:00Z'
    }
  ], {
    'focus-1': { comment: 'Bra utveckling' }
  });

  assert.deepEqual(model, [{
    id: 'focus-1',
    areaLabel: 'Spelförståelse',
    focusText: 'Läsa spelet snabbare',
    attentionText: 'Titta upp innan mottagning',
    reflection: 'Jag ser alternativen tidigare nu.',
    coachFeedback: 'Bra utveckling',
    endedAt: '2026-09-02T12:00:00Z'
  }]);
});

test('returns the empty state when no focus exists', () => {
  assert.deepEqual(buildFocusSummaryViewModel(null), {
    empty: true,
    areaLabel: '',
    focusText: 'Du har inget fokus ännu.',
    attentionText: '',
    statusLabel: '',
    coachFeedback: '',
    canComplete: false
  });
});