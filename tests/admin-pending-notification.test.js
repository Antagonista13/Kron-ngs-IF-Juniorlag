const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const admin=fs.readFileSync('admin-page.js','utf8');
const badge=fs.readFileSync('admin-sportadmin-badge.js','utf8');

test('admin profile shows pending SportAdmin player count and hides it at zero',()=>{
  assert.match(badge,/sportadmin_player_candidates/);
  assert.match(badge,/\.eq\(['"]status['"],['"]pending['"]\)/);
  assert.match(badge,/adminPendingBadge/);
  assert.match(badge,/hidden\s*=\s*!pending/);
});

test('pending badge is admin-only and opens administration',()=>{
  assert.match(admin,/if \(!admin\).*entry\.remove/);
  assert.match(admin,/openPage\('adminPage'\)/);
});
