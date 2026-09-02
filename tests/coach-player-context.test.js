const test = require('node:test');
const assert = require('node:assert/strict');
const coach = require('../coach.js');

test('builds read-only coach context for a player goal and focus', () => {
  assert.equal(typeof coach.buildCoachPlayerContext, 'function');
  assert.deepEqual(
    coach.buildCoachPlayerContext(
      { title: 'Bli bättre skytt' },
      [{ status: 'completed' }, { status: 'active' }],
      {
        development_area: 'game_understanding',
        focus_text: 'Läsa spelet snabbare',
        follow_up_status: 'active'
      }
    ),
    {
      goalTitle: 'Bli bättre skytt',
      goalProgress: '1 av 2 delmål klara',
      focusArea: 'Spelförståelse',
      focusText: 'Läsa spelet snabbare',
      focusStatus: 'Aktivt'
    }
  );
});
