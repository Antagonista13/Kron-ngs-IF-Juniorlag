const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachLayoutModel, isRedundantAssessmentHeading } = require('../coach-layout.js');

test('defines the four coach tool blocks in the intended order', () => {
  assert.deepEqual(buildCoachLayoutModel(), {
    overviewTitle: 'Spelaröversikt',
    contextTitle: 'Mål & fokus',
    feedbackTitle: 'Tränarens återkoppling',
    assessmentTitle: 'Självskattning & tränarbedömning',
    cardClass: 'coach-tool-card',
    assessmentIntroGap: 8,
    showPlayerNameInAssessment: false
  });
});

test('treats any extra direct h3 in the assessment card as redundant', () => {
  assert.equal(isRedundantAssessmentHeading('H3', 0), false);
  assert.equal(isRedundantAssessmentHeading('H3', 1), true);
  assert.equal(isRedundantAssessmentHeading('P', 1), false);
});
