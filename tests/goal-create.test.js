const test = require('node:test');
const assert = require('node:assert/strict');
const goalCreate = require('../goal-create.js');

test('builds a trimmed request for creating a new goal', () => {
  assert.deepEqual(
    goalCreate.buildGoalCreateRequest(
      '  Bli modigare i mitt spel  ',
      '  Jag vill våga ta fler initiativ.  ',
      '  Jag tar fler initiativ under träning och match.  '
    ),
    {
      p_title: 'Bli modigare i mitt spel',
      p_description: 'Jag vill våga ta fler initiativ.',
      p_success_description: 'Jag tar fler initiativ under träning och match.'
    }
  );
});

test('remembers development as the page to restore after saving a goal', () => {
  assert.equal(typeof goalCreate.rememberDevelopmentPage, 'function');

  const values = {};
  const storage = {
    setItem(key, value) { values[key] = value; }
  };

  goalCreate.rememberDevelopmentPage(storage);
  assert.equal(values.kronangReturnPage, 'developmentPage');
});
