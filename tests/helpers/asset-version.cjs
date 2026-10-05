const assert = require('node:assert/strict');
const fs = require('node:fs');

module.exports = function assertAssetVersion(html, asset, minimum) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...html.matchAll(new RegExp(escaped + '\\?v=(\\d+)', 'g'))];
  assert.equal(matches.length, 1, asset + ' must load exactly once');
  assert.ok(Number(matches[0][1]) >= minimum, asset + ' must not reuse a stale cache version');
  assert.ok(fs.existsSync(asset), asset + ' must exist');
};
