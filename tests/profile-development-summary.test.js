const test = require('node:test');
const assert = require('node:assert/strict');
const profileSummary = require('../profile-development-summary.js');

test('builds profile summary from active goal, subgoals and focus', () => {
  assert.deepEqual(
    profileSummary.buildProfileDevelopmentSummary(
      { title: 'Bli modigare i mitt spel' },
      [
        { status: 'completed' },
        { status: 'active' }
      ],
      {
        development_area: 'game_understanding',
        focus_text: 'Läsa spelet snabbare',
        follow_up_status: 'active'
      }
    ),
    {
      goalTitle: 'Bli modigare i mitt spel',
      goalProgress: '1 av 2 delmål klara',
      focusArea: 'Spelförståelse',
      focusText: 'Läsa spelet snabbare',
      focusStatus: 'Aktivt'
    }
  );
});

test('builds profile empty states', () => {
  assert.deepEqual(
    profileSummary.buildProfileDevelopmentSummary(null, [], null),
    {
      goalTitle: 'Du har inget mål ännu.',
      goalProgress: '',
      focusArea: '',
      focusText: 'Du har inget fokus ännu.',
      focusStatus: ''
    }
  );
});
