const fs = require('fs');
const path = require('path');
const assert = require('assert');

const edgePath = path.join(__dirname, '..', 'supabase', 'functions', 'approve-user', 'index.ts');
assert.ok(fs.existsSync(edgePath), 'approval Edge Function must exist');
const edge = fs.readFileSync(edgePath, 'utf8');
assert.ok(edge.includes('Authorization'), 'caller Authorization header must be checked');
assert.ok(edge.includes("role !== 'admin'"), 'caller must be an admin');
assert.ok(edge.includes("rpc('admin_approve_user'"), 'approval must reuse the existing server-side approval RPC');
assert.ok(edge.includes('signInWithOtp'), 'approval must send a Supabase email after approval');
assert.ok(edge.includes('shouldCreateUser: false'), 'approval email must never create a duplicate auth user');
assert.ok(edge.includes('emailSent'), 'response must report whether the approval email was sent');

const page = fs.readFileSync(path.join(__dirname, '..', 'admin-page.js'), 'utf8');
assert.ok(page.includes("functions.invoke('approve-user'"), 'admin approval must call the approval Edge Function');
assert.ok(page.includes('Godkänd'), 'admin UI must confirm successful approval');

console.log('admin approval email tests passed');
