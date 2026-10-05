const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoachLayoutModel } = require('../coach-layout.js');

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

// Repeated player headings are covered by coach-assessment-heading.test.js.
// The old mutation-based cleanup helper was intentionally removed.
