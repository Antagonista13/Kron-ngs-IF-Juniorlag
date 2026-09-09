# Admincenter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only operational Admincenter inside Kronäng Junior for SportAdmin sync, Supabase health, GitHub workflow state, and manual sync.

**Architecture:** Add a focused browser module for Admincenter presentation/status parsing, a Supabase migration for sync-run history/RLS, and extend the existing SportAdmin Edge Function to persist success/failure runs. Keep all secrets server-side; browser-triggered sync uses the signed-in admin session.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, Supabase Postgres/RLS, Supabase Edge Functions (Deno/TypeScript), GitHub public REST API.

**Spec:** `docs/superpowers/specs/2026-09-09-admincenter-design.md`

## Global Constraints

- Admincenter is available only to active `admin` users.
- Do not expose service-role keys, GitHub tokens, or `SPORTADMIN_SYNC_KEY` in browser code.
- Manual sync must invoke `sportadmin-roster-sync` through the signed-in Supabase session.
- GitHub status uses only public repository workflow data and degrades to `OKÄND` on failure/rate-limit.
- No destructive actions are included.

---

### Task 1: Admincenter browser contract and UI

**Files:**
- Create: `admin-center.js`
- Modify: `index.html`
- Modify: `admin-page.css`
- Test: `tests/admin-center.test.js`
- Modify: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- Produces: `window.KronangAdminCenter` with pure helpers `isActiveAdmin(profile)`, `githubStatusFromRun(run)`, `syncStatusFromRun(run)` and `init()`.
- Consumes: `window.kronangSupabase`, existing `adminPage`, current signed-in session.

- [ ] **Step 1: Write the failing browser contract test**

Create `tests/admin-center.test.js` to require `admin-center.js`, assert only active admins pass the role gate, assert GitHub status mapping for success/failure/in-progress/unavailable, assert sync-run mapping, assert `index.html` contains exactly one `admin-center.js` script and the `ADMINCENTER` section/button labels, and assert browser code contains no service-role/sync secret value access.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/admin-center.test.js`
Expected: FAIL because `admin-center.js` and Admincenter markup do not exist yet.

- [ ] **Step 3: Implement minimal Admincenter UI and pure status helpers**

Create compact status cards for SportAdmin, Supabase, and GitHub plus `KÖR SPORTADMIN-SYNK NU`. `init()` must verify an active admin, load the latest `sportadmin_sync_runs` row, verify the current Supabase profile, fetch public GitHub Actions runs, and wire manual sync through `kronangSupabase.functions.invoke('sportadmin-roster-sync')`.

- [ ] **Step 4: Wire asset and CI**

Load `admin-center.js` once after `admin-page.js`, add the Admincenter markup inside `adminPage`, style it in `admin-page.css`, add syntax/test commands to `home-news-tests.yml`.

- [ ] **Step 5: Run test and verify GREEN**

Run: `node --test tests/admin-center.test.js`
Expected: PASS.

### Task 2: Sync-run history schema and RLS

**Files:**
- Create: `supabase/migrations/202609090003_admincenter_sync_runs.sql`
- Test: `tests/admin-center-sql.test.js`

**Interfaces:**
- Produces: `public.sportadmin_sync_runs` and active-admin-only SELECT policy.
- Consumes: existing `public.profiles` and `auth.uid()`.

- [ ] **Step 1: Write failing SQL contract test**

Assert the migration creates all fields from the spec, enables RLS, grants SELECT only through an active-admin policy, and does not grant anon writes.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/admin-center-sql.test.js`
Expected: FAIL because migration is absent.

- [ ] **Step 3: Implement migration**

Create `sportadmin_sync_runs` with UUID primary key/default, timestamps, `status` check (`success`,`failure`), nonnegative `found/imported`, source/error/trigger fields, RLS enabled, and an active-admin SELECT policy. Revoke direct writes from `anon`/`authenticated` so only service-role execution can write.

- [ ] **Step 4: Run and verify GREEN**

Run: `node --test tests/admin-center-sql.test.js`
Expected: PASS.

### Task 3: Edge Function run recording

**Files:**
- Modify: `supabase/functions/sportadmin-roster-sync/index.ts`
- Test: `tests/sportadmin-roster-sync.test.js`
- Modify: `.github/workflows/sportadmin-sync-tests.yml`

**Interfaces:**
- Consumes: `sportadmin_sync_runs` from Task 2.
- Produces: one completed run row for every authorized sync attempt; `triggered_by='admin'` for authenticated admin JWT and `scheduled` for shared-secret calls.

- [ ] **Step 1: Extend the failing function contract test**

Assert source contains explicit trigger classification, captures start/finish timestamps, writes success metadata (`found`,`imported`) and writes a failure row before returning HTTP 500.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/sportadmin-roster-sync.test.js`
Expected: FAIL because run recording is not implemented.

- [ ] **Step 3: Implement run recording**

Change authorization to return `{authorized, triggeredBy}`. Create a service-role client after authorization, use one `startedAt`, and insert a `sportadmin_sync_runs` row on success and in catch. Failure recording must be best-effort and must not hide the original sync error.

- [ ] **Step 4: Run and verify GREEN**

Run: `node tests/sportadmin-roster-sync.test.js`
Expected: PASS.

### Task 4: Full verification and delivery

**Files:**
- All files changed above.

- [ ] **Step 1: Run all Admincenter tests**

Run: `node --test tests/admin-center.test.js tests/admin-center-sql.test.js && node tests/sportadmin-roster-sync.test.js`
Expected: PASS.

- [ ] **Step 2: Run existing security/role regressions**

Run: `node --test tests/security-stability-round.test.js tests/admin-access.test.js tests/admin-page-model.test.js`
Expected: PASS.

- [ ] **Step 3: Open PR and verify both CI workflows**

Expected: `Home and news tests` and `SportAdmin roster sync tests` both conclude success.

- [ ] **Step 4: Deploy backend before calling feature live**

Apply `202609090003_admincenter_sync_runs.sql`, deploy the updated `sportadmin-roster-sync` function, then verify a manual admin sync writes a successful run row. Frontend is merged only after user approval.
