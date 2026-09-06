const test = require('node:test');
const assert = require('node:assert/strict');
const page = require('../coach-player-page.js');

test('builds a richer player profile header from roster metadata', () => {
  const model = page.buildCoachPlayerProfile({
    name: 'Emil Bergqvist',
    shirtNumber: '23',
    position: 'Målvakt',
    isCaptain: true,
    avatarUrl: 'emil.jpg'
  });
  assert.equal(model.title, 'Emil Bergqvist');
  assert.equal(model.shirtNumber, '23');
  assert.equal(model.position, 'Målvakt');
  assert.deepEqual(model.badges, ['MÅLVAKT', 'KAPTEN']);
  assert.equal(model.avatarUrl, 'emil.jpg');
});

test('leader tools target existing development sections', () => {
  assert.deepEqual(page.buildCoachPlayerLeaderTools(), [
    { label: 'NYTT FOKUS', target: 'coachPlayerContext' },
    { label: 'GE FEEDBACK', target: 'coachFocusFeedbackControls' },
    { label: 'HANTERA MÅL', target: 'coachPlayerContext' }
  ]);
});

test('profile navigation prioritizes current development before history', () => {
  const labels = page.buildCoachPlayerNavigation().map(item => item.label);
  assert.deepEqual(labels, ['Utveckling just nu', 'Återkoppling', 'Bedömning', 'Historik']);
});