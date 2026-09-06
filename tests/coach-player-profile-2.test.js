const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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

test('leader tools describe focused editor behavior', () => {
  assert.deepEqual(page.buildCoachPlayerLeaderTools(), [
    { label: 'NYTT FOKUS', target: 'coachPlayerContext', mode: 'focus' },
    { label: 'GE FEEDBACK', target: 'coachFocusFeedbackControls', mode: 'feedback' },
    { label: 'HANTERA MÅL', target: 'coachPlayerContext', mode: 'goal' }
  ]);
});

test('focused leader tool helpers are available', () => {
  assert.equal(typeof page.openCoachPlayerQuickTool, 'function');
  assert.equal(typeof page.closeCoachPlayerQuickTool, 'function');
  const source = fs.readFileSync('coach-player-page.js', 'utf8');
  assert.ok(source.includes('coach-player-quick-tool-open'));
  assert.ok(source.includes('data-quick-tool'));
  assert.ok(source.includes('STÄNG'));
});

test('profile navigation prioritizes current development before history', () => {
  const labels = page.buildCoachPlayerNavigation().map(item => item.label);
  assert.deepEqual(labels, ['Utveckling just nu', 'Återkoppling', 'Bedömning', 'Historik']);
});