const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('development-workflow.css', 'utf8');

test('development page uses the available desktop width without changing mobile layout', () => {
  assert.match(css, /@media\(min-width:800px\)/);
  assert.match(css, /\.container:has\(#developmentPage\.active\)\{max-width:1000px\}/);
});

test('player goal and focus cards form a clean two-column desktop layout', () => {
  assert.match(css, /#developmentPage\.active\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /#developmentGoalSummary\{grid-column:1\}/);
  assert.match(css, /#developmentFocusSummary\{grid-column:2\}/);
  assert.match(css, /#developmentGoalHistory\{grid-column:1\}/);
  assert.match(css, /#developmentFocusHistory\{grid-column:2\}/);
  assert.match(css, /#developmentPage\.active \.page-heading[^}]*grid-column:1\/-1/);
  assert.match(css, /#developmentPage\.active \.development-grid[^}]*grid-column:1\/-1/);
});

test('coach development profile also becomes two columns on desktop while actions stay readable', () => {
  assert.match(css, /\.development-workflow-profile\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.development-workflow-profile>header[^}]*grid-column:1\/-1/);
  assert.match(css, /\.development-workflow-profile>\.development-history[^}]*grid-column:1\/-1/);
});
