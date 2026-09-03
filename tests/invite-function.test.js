const fs = require('fs');
const path = require('path');
const assert = require('assert');
const edgePath = path.join(__dirname, '..', 'supabase', 'functions', 'invite-user', 'index.ts');
const edge = fs.readFileSync(edgePath, 'utf8');
assert.ok(edge.includes('Authorization'), 'caller Authorization header must be checked');
assert.ok(edge.includes("role !== 'admin'"), 'caller must be an admin');
assert.ok(edge.includes('is_active'), 'caller active state must be checked');
assert.ok(edge.includes('inviteUserByEmail'), 'invite must be sent server-side');
assert.ok(edge.indexOf("role !== 'admin'") < edge.indexOf('inviteUserByEmail'), 'admin check must happen before sending invite');
assert.ok(edge.includes('SUPABASE_SERVICE_ROLE_KEY'), 'service role is only used in the Edge Function');
assert.ok(edge.includes("['', 'player', 'parent', 'coach']"), 'expected role must be constrained');
const clientFiles = ['admin-access.js', 'admin-page.js'];
for (const file of clientFiles) {
  assert.equal(fs.readFileSync(path.join(__dirname, '..', file), 'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'), false, file + ' must not contain service role key');
}
console.log('invite function security tests passed');
