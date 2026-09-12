# SMS-first Player Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an active admin invite an unlinked roster player from Laget via the stored mobile number, with the player supplying email and password only after opening the SMS link.

**Architecture:** Add a private onboarding-token table, one admin-only Edge Function that creates hashed single-use tokens and one public Edge Function that validates/consumes them and creates the Auth account. The existing invitation trigger remains authoritative by creating a temporary pending `user_invitations` row during account completion, after which the function immediately promotes the created profile to role `player` and links it to the selected roster row. The browser gets only the plaintext token in the SMS URL; the database stores SHA-256 only.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase Auth/Postgres/Edge Functions, Node 22 contract tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-12-sms-first-player-onboarding-design.md`

## Global Constraints

- Only active admins may create an onboarding link.
- Token lifetime is exactly 24 hours.
- Store only the SHA-256 token hash in Postgres; never store plaintext tokens.
- A new invite revokes prior unused tokens for the same player.
- Token completion must reject expired, revoked, consumed, inactive or already-linked players.
- The service-role key is server-side only.
- The existing parent/coach email invitation flow remains unchanged.
- Player activation must end with `profiles.role = 'player'`, `profiles.is_active = true`, and `players.profile_id` linked to the created Auth user.
- If Auth user creation succeeds but linking fails, delete the new Auth user and clean temporary invitation metadata so no orphan account remains.
- `createUser` is server-only and may use `email_confirm: true`; no service key may appear in browser code.

---

### Task 1: Add token schema and regression contract

**Files:**
- Create: `supabase/migrations/202609120001_player_sms_onboarding.sql`
- Create: `tests/player-sms-onboarding.test.js`
- Modify: `.github/workflows/player-phone-tests.yml`

- [ ] Write contract assertions for token table, RLS, hash-only storage, 24-hour expiry semantics, revoke/consume fields, and both Edge Function source files.
- [ ] Confirm the new test fails while files are missing.
- [ ] Add `player_onboarding_tokens` with FK constraints, indexes, RLS enabled, and no anon/authenticated direct grants.
- [ ] Add the new test to Player phone privacy CI.
- [ ] Re-run contract test and syntax checks.

### Task 2: Build create/validate/complete Edge Functions

**Files:**
- Create: `supabase/functions/create-player-onboarding/index.ts`
- Create: `supabase/functions/complete-player-onboarding/index.ts`

- [ ] Implement admin-authenticated `create-player-onboarding` accepting only `playerId`.
- [ ] Load active player plus protected mobile number; return explicit errors for missing phone or linked account.
- [ ] Generate 32 random bytes, base64url encode, SHA-256 hash, revoke active prior tokens, insert 24-hour token row, and return phone/playerName/inviteUrl.
- [ ] Implement public `complete-player-onboarding` with `validate` action for token/name lookup without exposing contact data.
- [ ] Implement completion action: validate token, reject existing Auth email, insert temporary `user_invitations` row, call server-side `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`, update profile to active player, link `players.profile_id`, mark token consumed.
- [ ] On any post-Auth failure, delete the created Auth user and temporary invitation row before returning error.
- [ ] Keep completion function callable without a user JWT while enforcing security entirely with the unguessable single-use token.

### Task 3: Add activation UI before normal login

**Files:**
- Create: `player-onboarding.js`
- Modify: `index.html`
- Modify: `auth.js`
- Create: `tests/player-sms-onboarding-ui.test.js`

- [ ] Add tests that require `?onboard=<token>` detection, validate-before-form behavior, player-name display, email/password/confirmation fields, and success/error states.
- [ ] Add `player-onboarding.js` before `auth.js` in `index.html` and bump relevant cache versions.
- [ ] In `auth.js`, do not render the normal login screen while SMS onboarding is active.
- [ ] Activation UI validates token through the completion Edge Function, then submits email/password and redirects to clean app URL/login on success.
- [ ] Invalid/expired/used links show a focused Swedish error and never reveal another player.

### Task 4: Put SMS invite in Laget player profile

**Files:**
- Create: `player-onboarding-invite.js`
- Modify: `player-roster.js`
- Modify: `player-roster.css`
- Modify: `index.html`
- Modify: `tests/player-roster-ui.test.js`

- [ ] Add UI tests for admin-only invite action, connected-account state, and SMS composer URI/message.
- [ ] Extend the opened public player profile with an admin-only onboarding slot/event hook while preserving the same profile for coach/player/parent.
- [ ] Render `BJUD IN VIA SMS` for unlinked active players and `Konto anslutet` for linked players.
- [ ] On click, call `create-player-onboarding`, show progress/specific error, then open the device SMS composer using the stored phone and generated URL.
- [ ] Style the invite action for the full-screen player profile and keep non-admin roles free of the control.

### Task 5: Deploy safely and verify production behavior

**Files:**
- Update branch only; no merge in this task.

- [ ] Apply migration to the Supabase project and run security/performance advisors.
- [ ] Deploy `create-player-onboarding` with JWT verification enabled.
- [ ] Deploy `complete-player-onboarding` with platform JWT verification disabled because the onboarding token is the pre-auth credential; the function itself validates token hash/expiry/single-use state.
- [ ] Verify database shape and function versions.
- [ ] Open a PR to `main` and wait for all CI checks.
- [ ] Do not merge automatically; report the PR and green/red state for user approval.
