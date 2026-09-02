const test = require('node:test');
const assert = require('node:assert/strict');
const coachContext = require('../coach-player-context.js');

test('builds read-only coach context for a player goal and focus', () => {
  assert.equal(typeof coachContext.buildCoachPlayerContext, 'function');
  assert.deepEqual(
    coachContext.buildCoachPlayerContext(
      { title: 'Bli bättre skytt' },
      [{ status: 'completed' }, { status: 'active' }],
      {
        development_area: 'game_understanding',
        focus_text: 'Läsa spelet snabbare',
        attention_text: 'Titta upp innan jag får bollen',
        follow_up_status: 'active'
      }
    ),
    {
      goalTitle: 'Bli bättre skytt',
      goalProgress: '1 av 2 delmål klara',
      focusArea: 'Spelförståelse',
      focusText: 'Läsa spelet snabbare',
      focusAttention: 'Titta upp innan jag får bollen',
      focusStatus: 'Aktivt'
    }
  );
});
