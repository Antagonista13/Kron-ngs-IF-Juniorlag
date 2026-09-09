const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const admin=fs.readFileSync('admin-page.js','utf8');

test('admin profile shows pending approval count and hides it at zero',()=>{
  assert.match(admin,/adminPendingBadge/);
  assert.match(admin,/overview\.pending/);
  assert.match(admin,/badge\.hidden\s*=\s*!pending/);
});

test('pending badge is admin-only and opens administration',()=>{
  assert.match(admin,/if \(!admin\).*entry\.remove/);
  assert.match(admin,/openPage\('adminPage'\)/);
});
