const fs = require('fs');
const path = require('path');
const assert = require('assert');

const edgePath = path.join(__dirname, '..', 'supabase', 'functions', 'approve-user', 'index.ts');
assert.ok(fs.existsSync(edgePath), 'approval Edge Function must exist');
const edge = fs.readFileSync(edgePath, 'utf8');
assert.ok(edge.includes('Authorization'), 'caller Authorization header must be checked');
assert.ok(edge.includes("role !== 'admin'"), 'caller must be an admin');
assert.ok(edge.includes("rpc('admin_approve_user'"), 'approval must reuse the existing server-side approval RPC');
assert.equal(edge.includes('signInWithOtp'), false, 'approval must not send a magic-link/OTP email after approval');
assert.equal(edge.includes('emailSent'), false, 'approval response must not report a misleading email status');
assert.ok(edge.includes("return json({ ok: true })"), 'approval must return success once the account is approved');

const page = fs.readFileSync(path.join(__dirname, '..', 'admin-page.js'), 'utf8');
assert.ok(page.includes("functions.invoke('approve-user'"), 'admin approval must call the approval Edge Function');
assert.ok(page.includes('Kontot är godkänt'), 'admin UI must confirm successful approval');
assert.equal(page.includes('bekräftelsemail kunde inte skickas'), false, 'admin UI must not show an email failure after successful approval');

console.log('admin approval tests passed');
