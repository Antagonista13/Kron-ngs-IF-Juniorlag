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
const serviceRoleName = 'SUPABASE_' + 'SERVICE_ROLE_KEY';
assert.ok(edge.includes(serviceRoleName), 'service role is only used in the Edge Function');
assert.ok(edge.includes("['', 'player', 'parent', 'coach']"), 'expected role must be constrained');
assert.ok(edge.includes("from('user_invitations')"), 'existing invitations must be checked before sending');
assert.ok(edge.includes('listUsers'), 'existing auth users must be checked before sending');
assert.ok(edge.includes('Already invited or registered'), 'duplicate invitations must return a clear conflict');
const clientFiles = ['admin-access.js', 'admin-page.js', 'team-staff.js'];
for (const file of clientFiles) {
  assert.equal(fs.readFileSync(path.join(__dirname, '..', file), 'utf8').includes(serviceRoleName), false, file + ' must not contain service role key');
}

const approvalEdgePath = path.join(__dirname, '..', 'supabase', 'functions', 'approve-user', 'index.ts');
assert.ok(fs.existsSync(approvalEdgePath), 'approval Edge Function must exist');
const approvalEdge = fs.readFileSync(approvalEdgePath, 'utf8');
assert.ok(approvalEdge.includes('Authorization'), 'approval caller Authorization header must be checked');
assert.ok(approvalEdge.includes("role !== 'admin'"), 'approval caller must be an admin');
assert.ok(approvalEdge.includes("rpc('admin_approve_user'"), 'approval must reuse the existing server-side approval RPC');
assert.equal(approvalEdge.includes('signInWithOtp'), false, 'approval must not send a magic-link email');
assert.equal(approvalEdge.includes('emailSent'), false, 'approval must not report a misleading email status');
const adminPage = fs.readFileSync(path.join(__dirname, '..', 'admin-page.js'), 'utf8');
assert.ok(adminPage.includes("functions.invoke('approve-user'"), 'admin approval must call the approval Edge Function');

console.log('invite function security tests passed');
