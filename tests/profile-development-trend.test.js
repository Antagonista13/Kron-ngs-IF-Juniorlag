const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPlayerDevelopmentTrend, getDevelopmentTrendMountTarget } = require('../profile-development-trend.js');

test('compares latest and previous assessment for all four areas', () => {
  const rows = [
    { created_at:'2026-09-03', technique_self:4, technique_coach:4, game_understanding_self:3, game_understanding_coach:4, physical_self:4, physical_coach:3, mentality_self:5, mentality_coach:4 },
    { created_at:'2026-06-01', technique_self:3, technique_coach:3, game_understanding_self:3, game_understanding_coach:3, physical_self:4, physical_coach:3, mentality_self:4, mentality_coach:4 }
  ];
  const model = buildPlayerDevelopmentTrend(rows);
  assert.equal(model.length, 4);
  assert.deepEqual(model[0], { label:'Teknik', selfCurrent:4, selfPrevious:3, coachCurrent:4, coachPrevious:3 });
  assert.equal(model[1].label, 'Spelförståelse');
  assert.equal(model[3].label, 'Mentalitet');
});

test('uses null for previous values when only one assessment exists', () => {
  const model = buildPlayerDevelopmentTrend([{ technique_self:4, technique_coach:3 }]);
  assert.equal(model[0].selfCurrent, 4);
  assert.equal(model[0].selfPrevious, null);
  assert.equal(model[0].coachCurrent, 3);
  assert.equal(model[0].coachPrevious, null);
});

test('development trend belongs on the development page', () => {
  assert.equal(getDevelopmentTrendMountTarget(), 'developmentPage');
});
