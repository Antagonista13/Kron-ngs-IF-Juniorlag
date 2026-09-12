const fs = require('fs');
const assert = require('assert');

const migrationPath = 'supabase/migrations/202609120001_player_sms_onboarding.sql';
assert.ok(fs.existsSync(migrationPath), 'player SMS onboarding migration must exist');
const migration = fs.readFileSync(migrationPath, 'utf8');
assert.ok(/create table if not exists public\.player_onboarding_tokens/i.test(migration), 'dedicated onboarding token table must exist');
assert.ok(/token_hash\s+text\s+not null\s+unique/i.test(migration), 'only a unique token hash must be stored');
assert.ok(/expires_at\s+timestamptz\s+not null/i.test(migration), 'tokens must expire');
assert.ok(/consumed_at\s+timestamptz/i.test(migration), 'tokens must track consumption');
assert.ok(/revoked_at\s+timestamptz/i.test(migration), 'tokens must track revocation');
assert.ok(/created_by\s+uuid\s+not null\s+references auth\.users/i.test(migration), 'token creator must be an Auth user');
assert.ok(/enable row level security/i.test(migration), 'token table must have RLS enabled');
assert.ok(/revoke all on public\.player_onboarding_tokens from anon/i.test(migration), 'anonymous users must not access token rows directly');
assert.ok(/revoke all on public\.player_onboarding_tokens from authenticated/i.test(migration), 'authenticated browser users must not access token rows directly');

const createPath = 'supabase/functions/create-player-onboarding/index.ts';
const completePath = 'supabase/functions/complete-player-onboarding/index.ts';
assert.ok(fs.existsSync(createPath), 'admin create-onboarding Edge Function must exist');
assert.ok(fs.existsSync(completePath), 'public complete-onboarding Edge Function must exist');
const createFn = fs.readFileSync(createPath, 'utf8');
const completeFn = fs.readFileSync(completePath, 'utf8');

assert.ok(createFn.includes('Authorization'), 'create function must authenticate the caller');
assert.ok(createFn.includes("role !== 'admin'"), 'create function must require admin role');
assert.ok(/player_contact_preferences/i.test(createFn), 'create function must load protected player phone data server-side');
assert.ok(/crypto\.getRandomValues/i.test(createFn), 'create function must generate cryptographically random tokens');
assert.ok(/SHA-256/i.test(createFn), 'create function must hash tokens with SHA-256');
assert.ok(/24\s*\*\s*60\s*\*\s*60\s*\*\s*1000|86400000/i.test(createFn), 'create function must use a 24 hour lifetime');
assert.ok(/revoked_at/i.test(createFn), 'creating a new link must revoke previous active links');
assert.equal(/insert\([^)]*token\s*:/i.test(createFn), false, 'plaintext token must never be inserted into Postgres');

assert.ok(/SHA-256/i.test(completeFn), 'complete function must hash the presented token');
assert.ok(/expires_at/i.test(completeFn) && /consumed_at/i.test(completeFn) && /revoked_at/i.test(completeFn), 'complete function must enforce all token states');
assert.ok(/auth\.admin\.createUser/i.test(completeFn), 'complete function must create the Auth user server-side');
assert.ok(/email_confirm\s*:\s*true/i.test(completeFn), 'closed invitation flow must confirm the supplied email server-side');
assert.ok(/expected_role\s*:\s*['"]player['"]/i.test(completeFn), 'completion must bridge through the existing invite-only trigger as a player invitation');
assert.ok(/from\(['"]profiles['"]\)[\s\S]*role\s*:\s*['"]player['"]/i.test(completeFn), 'created profile must become a player');
assert.ok(/from\(['"]players['"]\)[\s\S]*profile_id/i.test(completeFn), 'correct roster player must be linked to the new profile');
assert.ok(/deleteUser/i.test(completeFn), 'post-auth failures must clean up the created Auth user');
assert.ok(/action\s*===\s*['"]validate['"]/i.test(completeFn), 'public endpoint must support validate-before-form');

console.log('player SMS onboarding backend contract ok');
