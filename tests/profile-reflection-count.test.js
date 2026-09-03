const test = require('node:test');
const assert = require('node:assert/strict');
const { countPlayerReflections } = require('../profile-reflection-count.js');

test('counts non-empty goal and focus reflections', () => {
  const goals = [
    { final_reflection: 'Jag lärde mig mycket.' },
    { final_reflection: '   ' },
    { final_reflection: null }
  ];
  const focuses = [
    { player_reflection: 'Första touchen blev bättre.' },
    { player_reflection: '' }
  ];
  assert.equal(countPlayerReflections(goals, focuses), 2);
});

test('returns zero when there are no reflections', () => {
  assert.equal(countPlayerReflections([], []), 0);
});
