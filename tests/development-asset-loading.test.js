const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('development role does not dynamically inject workflow scripts', () => {
  const source = fs.readFileSync('development-role.js', 'utf8');
  assert.equal(source.includes("document.createElement('script')"), false);
  assert.equal(source.includes('loadDevelopmentWorkflowAssets'), false);
});
