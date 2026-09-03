const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPlayerDevelopmentTrend, getDevelopmentTrendMountTarget, buildTrendDisplay } = require('../profile-development-trend.js');

test('compares latest and previous complete self and coach assessments independently', () => {
  const rows = [
    { created_at:'2026-09-03T12:00:00Z', technique_self:4, game_understanding_self:3, physical_self:4, mentality_self:5, technique_coach:null, game_understanding_coach:null, physical_coach:null, mentality_coach:null },
    { created_at:'2026-09-03T10:00:00Z', technique_self:null, game_understanding_self:null, physical_self:null, mentality_self:null, technique_coach:4, game_understanding_coach:4, physical_coach:3, mentality_coach:4 },
    { created_at:'2026-06-01T12:00:00Z', technique_self:3, game_understanding_self:3, physical_self:4, mentality_self:4, technique_coach:null, game_understanding_coach:null, physical_coach:null, mentality_coach:null },
    { created_at:'2026-06-01T10:00:00Z', technique_self:null, game_understanding_self:null, physical_self:null, mentality_self:null, technique_coach:3, game_understanding_coach:3, physical_coach:3, mentality_coach:4 }
  ];
  const result = buildPlayerDevelopmentTrend(rows);
  assert.equal(result.hasSelfPrevious, true);
  assert.equal(result.hasCoachPrevious, true);
  assert.deepEqual(result.areas[0], { label:'Teknik', selfCurrent:4, selfPrevious:3, coachCurrent:4, coachPrevious:3 });
});

test('does not treat a coach-only row as the previous self assessment', () => {
  const rows = [
    { technique_self:2, game_understanding_self:3, physical_self:4, mentality_self:3 },
    { technique_self:null, game_understanding_self:null, physical_self:null, mentality_self:null, technique_coach:4, game_understanding_coach:4, physical_coach:4, mentality_coach:4 },
    { technique_self:5, game_understanding_self:3, physical_self:4, mentality_self:3 }
  ];
  const result = buildPlayerDevelopmentTrend(rows);
  assert.equal(result.areas[0].selfCurrent, 2);
  assert.equal(result.areas[0].selfPrevious, 5);
});

test('uses null previous values when there is only one complete assessment of that type', () => {
  const result = buildPlayerDevelopmentTrend([{ technique_self:4, game_understanding_self:3, physical_self:4, mentality_self:5, technique_coach:3, game_understanding_coach:3, physical_coach:3, mentality_coach:3 }]);
  assert.equal(result.areas[0].selfPrevious, null);
  assert.equal(result.areas[0].coachPrevious, null);
  assert.equal(result.hasSelfPrevious, false);
  assert.equal(result.hasCoachPrevious, false);
});

test('trend display makes current previous and change explicit', () => {
  assert.deepEqual(buildTrendDisplay(1, 4), {
    current: '★☆☆☆☆',
    previous: '★★★★☆',
    change: '−3'
  });
  assert.deepEqual(buildTrendDisplay(3, 3), {
    current: '★★★☆☆',
    previous: '★★★☆☆',
    change: 'Oförändrat'
  });
});

test('development trend belongs on the development page', () => {
  assert.equal(getDevelopmentTrendMountTarget(), 'developmentPage');
});
