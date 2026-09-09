const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const admin=fs.readFileSync('admin-page.js','utf8');

test('admin profile shows pending SportAdmin player count and hides it at zero',()=>{
  assert.match(admin,/sportadmin_player_candidates/);
  assert.match(admin,/\.eq\(['"]status['"],['"]pending['"]\)/);
  assert.match(admin,/adminPendingBadge/);
  assert.match(admin,/badge\.hidden\s*=\s*!pending/);
});

test('pending badge is admin-only and opens administration',()=>{
  assert.match(admin,/if \(!admin\).*entry\.remove/);
  assert.match(admin,/openPage\('adminPage'\)/);
});
