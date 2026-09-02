const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFocusSummaryViewModel } = require('../focus-summary.js');

test('builds a Swedish read-only focus summary', () => {
  const model = buildFocusSummaryViewModel({
    development_area: 'game_understanding',
    focus_text: 'Läsa spelet snabbare',
    attention_text: 'Titta upp innan mottagning',
    follow_up_status: 'active'
  });

  assert.deepEqual(model, {
    empty: false,
    areaLabel: 'Spelförståelse',
    focusText: 'Läsa spelet snabbare',
    attentionText: 'Titta upp innan mottagning',
    statusLabel: 'Aktivt'
  });
});

test('returns the empty state when no focus exists', () => {
  assert.deepEqual(buildFocusSummaryViewModel(null), {
    empty: true,
    areaLabel: '',
    focusText: 'Du har inget fokus ännu.',
    attentionText: '',
    statusLabel: ''
  });
});