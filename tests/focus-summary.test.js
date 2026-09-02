const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFocusSummaryViewModel } = require('../focus-summary.js');

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
    coachFeedback: 'Bra utveckling. Fortsätt att titta upp innan du får bollen.'
  });
});

test('returns the empty state when no focus exists', () => {
  assert.deepEqual(buildFocusSummaryViewModel(null), {
    empty: true,
    areaLabel: '',
    focusText: 'Du har inget fokus ännu.',
    attentionText: '',
    statusLabel: '',
    coachFeedback: ''
  });
});