# Player Development Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a coach-to-player development workflow with a coach worklist, 28-day follow-up state, player-owned goals with coach proposals, leader-only notes, and persistent in-app unread notifications.

**Architecture:** Extend the existing Supabase-backed development model rather than replacing it. Keep roster summary logic, development profile UI, and notification indicator in focused browser modules; enforce every role boundary and state transition in Supabase RLS/RPCs so browser hiding is never the security boundary.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Supabase Postgres/RLS/RPC, Node built-in test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-player-development-workflow-design.md`

## Global Constraints

- The player owns the active development goal.
- Coaches may propose a new or revised goal, but only the player may accept it as active.
- Follow-up interval is exactly 28 days.
- A registered follow-up requires a non-empty comment.
- Visibility values are exactly `player_visible` and `leaders_only`.
- Proposal statuses are exactly `pending`, `accepted`, and `rejected`.
- Parent has no personal player-development access in version 1.
- Leaders-only content must never be returned to Player or Parent.
- Player-visible follow-ups/notes and pending goal proposals may create player notifications; leaders-only content never does.
- The red unread indicator is a dot only; no numeric badge in version 1.
- Opening the Development page alone must not clear all unread notifications.
- Push notifications, advanced analytics, AI coaching suggestions, and exercise-library recommendations are out of scope.
- Existing `players.profile_id` remains the roster-to-auth bridge.
- Existing mobile-first visual language and bottom navigation are preserved.
- All new behavior is developed TDD-first; do not open a PR until the full branch suite is green.

---

## File Map

### New files

- `supabase/migrations/202609040011_player_development_workflow.sql` — schema, constraints, indexes, RLS, transactional RPCs for follow-ups, notes, proposals, proposal response, and read notifications.
- `development-workflow.js` — pure client-side view-model helpers: 28-day status, recent activity timestamp, filter behavior, note/proposal display state, and validation.
- `development-profile.js` — role-aware profile workflow UI and Supabase calls for one player.
- `development-notifications.js` — unread notification loading, red-dot derivation, related-item read behavior.
- `development-workflow.css` — coach worklist, development profile, note visibility labels, proposal panel, and unread/new visual treatment.
- `tests/development-workflow.test.js` — 28-day calculation, filtering, model-building, validation.
- `tests/development-profile.test.js` — role/action visibility and proposal/follow-up UI model tests.
- `tests/development-notifications.test.js` — unread derivation/read behavior and red-dot tests.
- `tests/player-development-sql.test.js` — static SQL/security contract tests for migration 011.
- `tests/player-development-assets.test.js` — asset load order/cache-version checks.

### Existing files to modify

- `coach-roster-summary.js` — replace assessment-centric worklist status with follow-up-centric development status while preserving existing goal/focus data.
- `coach-roster-summary.css` — retain current layout hooks but adapt badges/cards for follow-up state and new filters.
- `coach-player-page.js` — hand off player selection/opening to the new development-profile module without duplicating fetch logic.
- `development.js` — keep the current self-assessment feature but mount the new player profile workflow around it for Player/Admin/Coach as allowed.
- `development-role.js` — expose exact role predicates used by the new development profile UI.
- `role-permissions.js` — add explicit development-workflow capability names if current generic permissions are insufficient.
- `index.html` — load `development-workflow.css`, `development-workflow.js`, `development-profile.js`, and `development-notifications.js`; add the dot anchor in the Development nav item and cache-bump changed assets.
- `.github/workflows/home-news-tests.yml` — execute all new test files and add migration 011 security greps.

---

### Task 1: Add pure development workflow model logic

**Files:**
- Create: `development-workflow.js`
- Create: `tests/development-workflow.test.js`

**Interfaces:**
- Produces: `needsDevelopmentFollowUp(lastFollowUpAt, now)` -> boolean
- Produces: `latestMeaningfulDevelopmentAt({ followUps, notes, goals, proposals })` -> ISO string or null
- Produces: `buildDevelopmentRosterItem(player, goal, focus, followUps, notes, proposals, now)` -> roster item object
- Produces: `filterDevelopmentRosterItems(items, query, filter)` -> array
- Produces: `validateDevelopmentEntry(comment, visibility)` -> `{ ok, message }`
- Produces: `validateGoalProposal(goalText)` -> `{ ok, message }`

- [ ] **Step 1: Write the failing 28-day and filter tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  needsDevelopmentFollowUp,
  filterDevelopmentRosterItems,
  validateDevelopmentEntry,
  validateGoalProposal
} = require('../development-workflow.js');

test('follow-up becomes due at exactly 28 days', () => {
  const now = new Date('2026-09-04T12:00:00Z');
  assert.equal(needsDevelopmentFollowUp('2026-08-07T12:00:00Z', now), true);
  assert.equal(needsDevelopmentFollowUp('2026-08-08T12:00:01Z', now), false);
});

test('missing follow-up is treated as needing follow-up without inventing a date', () => {
  assert.equal(needsDevelopmentFollowUp(null, new Date('2026-09-04T12:00:00Z')), true);
});

test('worklist filters follow-up and missing goal states', () => {
  const items = [
    { id: '1', name: 'Anna', needsFollowUp: true, hasGoal: true, recentlyUpdated: false },
    { id: '2', name: 'Bertil', needsFollowUp: false, hasGoal: false, recentlyUpdated: true }
  ];
  assert.deepEqual(filterDevelopmentRosterItems(items, '', 'needs-follow-up').map(x => x.id), ['1']);
  assert.deepEqual(filterDevelopmentRosterItems(items, '', 'missing-goal').map(x => x.id), ['2']);
  assert.deepEqual(filterDevelopmentRosterItems(items, '', 'recent').map(x => x.id), ['2']);
});

test('registered development entry requires text and exact visibility', () => {
  assert.equal(validateDevelopmentEntry('', 'player_visible').ok, false);
  assert.equal(validateDevelopmentEntry('Bra arbete', 'unknown').ok, false);
  assert.equal(validateDevelopmentEntry('Bra arbete', 'leaders_only').ok, true);
});

test('goal proposal requires non-empty text', () => {
  assert.equal(validateGoalProposal('   ').ok, false);
  assert.equal(validateGoalProposal('Spela snabbare på få tillslag').ok, true);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
node --test tests/development-workflow.test.js
```

Expected: FAIL because `development-workflow.js` or its exported functions do not yet exist.

- [ ] **Step 3: Implement the minimal pure helpers**

```js
const FOLLOW_UP_DAYS = 28;

function needsDevelopmentFollowUp(lastFollowUpAt, nowValue) {
  if (!lastFollowUpAt) return true;
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue || Date.now());
  const last = new Date(lastFollowUpAt);
  if (Number.isNaN(last.getTime()) || Number.isNaN(now.getTime())) return true;
  return now.getTime() - last.getTime() >= FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000;
}

function validateDevelopmentEntry(comment, visibility) {
  const text = (comment || '').trim();
  const allowed = visibility === 'player_visible' || visibility === 'leaders_only';
  if (!text) return { ok: false, message: 'Skriv en kommentar innan du sparar.' };
  if (!allowed) return { ok: false, message: 'Välj vem som ska kunna se anteckningen.' };
  return { ok: true, message: '' };
}

function validateGoalProposal(goalText) {
  return (goalText || '').trim()
    ? { ok: true, message: '' }
    : { ok: false, message: 'Skriv det mål du vill föreslå.' };
}
```

Implement `latestMeaningfulDevelopmentAt`, `buildDevelopmentRosterItem`, and `filterDevelopmentRosterItems` in the same module with these exact filter keys: `all`, `needs-follow-up`, `missing-goal`, `recent`.

Export the helpers through `module.exports` for Node and `window.KronangDevelopmentWorkflow` for the browser.

- [ ] **Step 4: Run the tests and verify GREEN**

```bash
node --test tests/development-workflow.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add development-workflow.js tests/development-workflow.test.js
git commit -m "feat: add player development workflow model"
```

---

### Task 2: Add Supabase schema, security, and transactional RPCs

**Files:**
- Create: `supabase/migrations/202609040011_player_development_workflow.sql`
- Create: `tests/player-development-sql.test.js`
- Modify: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- Produces table `development_entries`
- Produces table `development_goal_proposals`
- Produces table `development_notifications`
- Produces RPC `leader_create_development_entry(p_player_id uuid, p_comment text, p_visibility text, p_entry_type text)`
- Produces RPC `leader_propose_development_goal(p_player_id uuid, p_goal_text text, p_comment text)`
- Produces RPC `player_respond_goal_proposal(p_proposal_id uuid, p_decision text)`
- Produces RPC `mark_development_notification_read(p_notification_id uuid)`

- [ ] **Step 1: Write failing SQL contract tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const sqlPath = 'supabase/migrations/202609040011_player_development_workflow.sql';

test('migration defines development workflow entities and RPCs', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  for (const token of [
    'create table if not exists public.development_entries',
    'create table if not exists public.development_goal_proposals',
    'create table if not exists public.development_notifications',
    'leader_create_development_entry',
    'leader_propose_development_goal',
    'player_respond_goal_proposal',
    'mark_development_notification_read'
  ]) assert.match(sql.toLowerCase(), new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('migration constrains visibility and proposal status', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.match(sql, /player_visible/);
  assert.match(sql, /leaders_only/);
  assert.match(sql, /pending/);
  assert.match(sql, /accepted/);
  assert.match(sql, /rejected/);
});

test('migration contains role-aware RLS and no parent read policy', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8').toLowerCase();
  assert.match(sql, /enable row level security/);
  assert.match(sql, /is_leader\(\)/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.doesNotMatch(sql, /role\s*=\s*'parent'.*development_entries/s);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/player-development-sql.test.js
```

Expected: FAIL because migration 011 does not exist.

- [ ] **Step 3: Implement the migration**

Create `development_entries` with columns:

```sql
id uuid primary key default gen_random_uuid(),
player_id uuid not null references public.players(id) on delete cascade,
author_profile_id uuid not null references public.profiles(id),
entry_type text not null check (entry_type in ('follow_up','note')),
visibility text not null check (visibility in ('player_visible','leaders_only')),
comment text not null check (length(btrim(comment)) > 0),
created_at timestamptz not null default now()
```

Create `development_goal_proposals` with:

```sql
id uuid primary key default gen_random_uuid(),
player_id uuid not null references public.players(id) on delete cascade,
proposed_by_profile_id uuid not null references public.profiles(id),
proposed_goal_text text not null check (length(btrim(proposed_goal_text)) > 0),
coach_comment text,
status text not null default 'pending' check (status in ('pending','accepted','rejected')),
created_at timestamptz not null default now(),
resolved_at timestamptz
```

Create a partial unique index that allows at most one pending proposal per player:

```sql
create unique index if not exists one_pending_goal_proposal_per_player
on public.development_goal_proposals(player_id)
where status = 'pending';
```

Create `development_notifications` with:

```sql
id uuid primary key default gen_random_uuid(),
recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
event_type text not null,
entity_type text not null,
entity_id uuid not null,
created_at timestamptz not null default now(),
read_at timestamptz
```

Use existing helpers `public.is_leader()`, `public.current_profile_role()`, and `players.profile_id` in RLS. Leaders may read all workflow rows. A Player may read only rows attached to their own `players.profile_id = auth.uid()`, and for `development_entries` only when `visibility = 'player_visible'`. Parent receives no policy granting access.

Make `leader_create_development_entry` `security definer`, verify `is_leader()`, validate comment/type/visibility, insert entry, and in the same transaction insert a notification only when visibility is `player_visible` and the player has a non-null `profile_id`. Event type is `development_follow_up` for `follow_up`, otherwise `development_note`.

Make `leader_propose_development_goal` verify leader role, create a pending proposal, and create `goal_proposal` notification for linked player in the same transaction.

Make `player_respond_goal_proposal` verify that the proposal belongs to the current user's linked player and is still `pending`. Accept only decisions `accepted` or `rejected`. On `accepted`, archive the current active row in `development_goals` by setting its status away from `active` using the existing schema's historical status convention, then insert the proposed text as the new active goal. On `rejected`, leave active goal unchanged. In both cases set proposal status and `resolved_at = now()` and reject a second transition.

Make `mark_development_notification_read` update only a row where `recipient_profile_id = auth.uid()` and `read_at is null`.

Grant only required RPC execute permissions to `authenticated`; revoke from `public`.

- [ ] **Step 4: Run SQL tests and security grep**

```bash
node --test tests/player-development-sql.test.js
grep -R "SERVICE_ROLE_KEY" supabase/migrations/202609040011_player_development_workflow.sql && exit 1 || true
```

Expected: tests PASS and grep finds no service-role key reference.

- [ ] **Step 5: Add the tests to CI and run locally**

Append to `.github/workflows/home-news-tests.yml`:

```yaml
- name: Player development workflow tests
  run: |
    node --test tests/development-workflow.test.js
    node --test tests/player-development-sql.test.js
```

Run the exact commands locally and expect PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/202609040011_player_development_workflow.sql tests/player-development-sql.test.js .github/workflows/home-news-tests.yml
git commit -m "feat: secure player development workflow data"
```

---

### Task 3: Convert coach roster summary into a follow-up worklist

**Files:**
- Modify: `coach-roster-summary.js`
- Modify: `coach-roster-summary.css`
- Modify: `development-workflow.js`
- Modify: `tests/development-workflow.test.js`

**Interfaces:**
- Consumes: `buildDevelopmentRosterItem`, `filterDevelopmentRosterItems`, `needsDevelopmentFollowUp`
- Produces: coach worklist filters `Alla`, `Behöver följas upp`, `Saknar mål`, `Nyligen uppdaterade`

- [ ] **Step 1: Extend failing roster model tests**

Add:

```js
test('roster item derives latest registered follow-up and due state', () => {
  const item = buildDevelopmentRosterItem(
    { id: 'p1', full_name: 'Testspelare', shirt_number: 10 },
    { title: 'Spela framåt', status: 'active', created_at: '2026-09-01T10:00:00Z' },
    { focus_text: 'Första touch', lifecycle_status: 'active', created_at: '2026-09-02T10:00:00Z' },
    [{ player_id: 'p1', entry_type: 'follow_up', created_at: '2026-08-01T10:00:00Z' }],
    [],
    [],
    new Date('2026-09-04T10:00:00Z')
  );
  assert.equal(item.shirtNumber, 10);
  assert.equal(item.needsFollowUp, true);
  assert.equal(item.lastFollowUpAt, '2026-08-01T10:00:00Z');
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/development-workflow.test.js
```

Expected: FAIL until the roster item includes the new properties.

- [ ] **Step 3: Update roster loading and rendering**

In `loadCoachRosterSummary`, fetch active players with `shirt_number` and query:

```js
window.kronangSupabase.from('development_entries')
  .select('player_id, entry_type, visibility, created_at')
  .in('player_id', playerIds)
  .order('created_at', { ascending: false });

window.kronangSupabase.from('development_goal_proposals')
  .select('player_id, status, created_at, resolved_at')
  .in('player_id', playerIds);
```

Stop using coach assessment completion as the follow-up clock. Keep current active goal/focus fetches.

Render each card with these lines:

```text
#10 · Testspelare
Mål: Spela framåt
Fokus: Första touch
Senast uppföljd: 1 aug 2026
Behöver följas upp
```

Use the four exact filter labels from the spec. `Nyligen uppdaterade` uses meaningful development activity only and a seven-day client display window; keep that window in a named constant `RECENT_ACTIVITY_DAYS = 7` so it can be changed later without affecting the 28-day rule.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/development-workflow.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add coach-roster-summary.js coach-roster-summary.css development-workflow.js tests/development-workflow.test.js
git commit -m "feat: turn coach roster into development worklist"
```

---

### Task 4: Build the role-aware player development profile and coach actions

**Files:**
- Create: `development-profile.js`
- Create: `development-workflow.css`
- Create: `tests/development-profile.test.js`
- Modify: `coach-player-page.js`
- Modify: `development.js`
- Modify: `development-role.js`

**Interfaces:**
- Consumes RPCs from Task 2
- Produces: `buildDevelopmentProfileModel({ role, player, goal, focus, entries, proposal })`
- Produces: `canRegisterDevelopmentFollowUp(role)`
- Produces: `canProposeDevelopmentGoal(role)`
- Produces: `canEditOwnDevelopmentGoal(role, ownsPlayer)`

- [ ] **Step 1: Write failing role/profile tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildDevelopmentProfileModel,
  canRegisterDevelopmentFollowUp,
  canProposeDevelopmentGoal,
  canEditOwnDevelopmentGoal
} = require('../development-profile.js');

test('leaders get coach actions and player does not', () => {
  assert.equal(canRegisterDevelopmentFollowUp('coach'), true);
  assert.equal(canRegisterDevelopmentFollowUp('admin'), true);
  assert.equal(canRegisterDevelopmentFollowUp('player'), false);
  assert.equal(canProposeDevelopmentGoal('coach'), true);
});

test('player can edit own goal only', () => {
  assert.equal(canEditOwnDevelopmentGoal('player', true), true);
  assert.equal(canEditOwnDevelopmentGoal('player', false), false);
  assert.equal(canEditOwnDevelopmentGoal('parent', true), false);
});

test('leaders-only entries are excluded from player profile model', () => {
  const model = buildDevelopmentProfileModel({
    role: 'player',
    player: { id: 'p1' },
    entries: [
      { id: 'a', visibility: 'player_visible', comment: 'Synlig' },
      { id: 'b', visibility: 'leaders_only', comment: 'Intern' }
    ]
  });
  assert.deepEqual(model.entries.map(x => x.id), ['a']);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/development-profile.test.js
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement profile model and rendering**

Build the page in four sections in this order:

```text
Spelare / status
Mitt utvecklingsmål
Aktuellt fokus
Uppföljningar & anteckningar
```

For Admin/Coach add two primary actions:

```text
REGISTRERA UPPFÖLJNING
FÖRESLÅ ÄNDRING AV MÅL
```

Follow-up form fields:

```html
<textarea id="developmentEntryComment" required></textarea>
<label><input type="radio" name="developmentVisibility" value="player_visible" checked> Synlig för spelaren</label>
<label><input type="radio" name="developmentVisibility" value="leaders_only"> Endast ledare</label>
```

Before RPC invocation call `KronangDevelopmentWorkflow.validateDevelopmentEntry`. Preserve textarea contents on error. On success reload the profile and worklist.

Proposal form uses required goal text plus optional coach comment and calls `leader_propose_development_goal`.

For Player, render a pending proposal next to current goal with exact actions `GODKÄNN` and `BEHÅLL MITT MÅL`; call `player_respond_goal_proposal` with decisions `accepted` and `rejected` respectively.

Player goal editing continues through the existing player-owned goal RPC/flow rather than giving Coach direct update rights.

Mark `leaders_only` entries with visible `Endast ledare` label in Coach/Admin UI.

Do not duplicate current self-assessment behavior in `development.js`; mount profile workflow before/around it and leave current star/reflection save logic intact.

- [ ] **Step 4: Run and verify GREEN**

```bash
node --test tests/development-profile.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add development-profile.js development-workflow.css tests/development-profile.test.js coach-player-page.js development.js development-role.js
git commit -m "feat: add player development profile workflow"
```

---

### Task 5: Add persistent unread notifications and red dot

**Files:**
- Create: `development-notifications.js`
- Create: `tests/development-notifications.test.js`
- Modify: `development-profile.js`
- Modify: `development-workflow.css`

**Interfaces:**
- Produces: `hasUnreadDevelopmentNotifications(notifications)` -> boolean
- Produces: `notificationMatchesEntity(notification, entityType, entityId)` -> boolean
- Produces: `markRelatedNotificationRead(entityType, entityId)` -> Promise
- Consumes: `mark_development_notification_read` RPC

- [ ] **Step 1: Write failing unread tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  hasUnreadDevelopmentNotifications,
  notificationMatchesEntity
} = require('../development-notifications.js');

test('red dot derives only from unread items', () => {
  assert.equal(hasUnreadDevelopmentNotifications([{ id: '1', read_at: null }]), true);
  assert.equal(hasUnreadDevelopmentNotifications([{ id: '1', read_at: '2026-09-04T12:00:00Z' }]), false);
});

test('notification matches its related development entity', () => {
  assert.equal(notificationMatchesEntity({ entity_type: 'development_entry', entity_id: 'e1' }, 'development_entry', 'e1'), true);
  assert.equal(notificationMatchesEntity({ entity_type: 'goal_proposal', entity_id: 'g1' }, 'development_entry', 'g1'), false);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/development-notifications.test.js
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement notification loader and dot behavior**

For signed-in Player only, fetch:

```js
window.kronangSupabase
  .from('development_notifications')
  .select('id, event_type, entity_type, entity_id, created_at, read_at')
  .is('read_at', null)
  .order('created_at', { ascending: false });
```

Toggle `.has-unread` on the Development nav item and a child `.development-unread-dot`.

Do not mark anything read merely because `developmentPage` became active. When `development-profile.js` renders a related entry/proposal, add `NYTT` if an unread notification matches that entity. When the player opens/expands/views that concrete item, call `mark_development_notification_read` for its notification id, then refresh unread state.

- [ ] **Step 4: Run and verify GREEN**

```bash
node --test tests/development-notifications.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add development-notifications.js tests/development-notifications.test.js development-profile.js development-workflow.css
git commit -m "feat: add development unread notifications"
```

---

### Task 6: Wire browser assets, cache versions, and full role visibility

**Files:**
- Modify: `index.html`
- Modify: `role-permissions.js`
- Create: `tests/player-development-assets.test.js`
- Modify: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- Consumes all browser modules from Tasks 1, 4, and 5.
- Produces Development bottom-nav unread-dot anchor.

- [ ] **Step 1: Write failing asset tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');

test('development workflow assets load in dependency order', () => {
  const model = html.indexOf('development-workflow.js?v=1');
  const profile = html.indexOf('development-profile.js?v=1');
  const notifications = html.indexOf('development-notifications.js?v=1');
  assert.ok(model >= 0 && profile > model && notifications > profile);
  assert.match(html, /development-workflow\.css\?v=1/);
});

test('development nav contains unread dot hook', () => {
  assert.match(html, /development-unread-dot/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/player-development-assets.test.js
```

Expected: FAIL because assets are not wired yet.

- [ ] **Step 3: Wire `index.html`**

Add:

```html
<link rel="stylesheet" href="development-workflow.css?v=1">
```

Change the Development nav item to include:

```html
<span class="nav-icon-wrap"><span>⚽</span><i class="development-unread-dot" aria-hidden="true"></i></span><small>Utveckling</small>
```

Load scripts after `development-role.js` and before modules that consume the new workflow state:

```html
<script src="development-workflow.js?v=1"></script>
<script src="development-profile.js?v=1"></script>
<script src="development-notifications.js?v=1"></script>
```

Cache-bump every modified existing JS/CSS reference once, and update the asset test with those exact versions.

Add explicit permission predicates in `role-permissions.js` so Player/Admin/Coach/Parent UI visibility matches the spec even before database denial is encountered.

- [ ] **Step 4: Add all new test files to CI**

CI command block must include:

```yaml
node --test tests/development-workflow.test.js
node --test tests/development-profile.test.js
node --test tests/development-notifications.test.js
node --test tests/player-development-sql.test.js
node --test tests/player-development-assets.test.js
```

- [ ] **Step 5: Run targeted tests and verify GREEN**

```bash
node --test tests/development-workflow.test.js \
  tests/development-profile.test.js \
  tests/development-notifications.test.js \
  tests/player-development-sql.test.js \
  tests/player-development-assets.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html role-permissions.js tests/player-development-assets.test.js .github/workflows/home-news-tests.yml
git commit -m "feat: wire player development workflow"
```

---

### Task 7: Full verification and live migration handoff

**Files:**
- Review all files changed in Tasks 1–6.

**Interfaces:**
- Produces a green branch ready for PR.

- [ ] **Step 1: Run the repository's complete existing test command set**

Read `.github/workflows/home-news-tests.yml` and run every `node --test` command listed there locally, including all legacy home/news/auth/admin/roster tests plus the five new development tests.

Expected: all PASS; no intentional red run is pushed to GitHub.

- [ ] **Step 2: Run security checks**

```bash
grep -R "SUPABASE_SERVICE_ROLE_KEY" . --exclude-dir=.git --exclude='*.md' && exit 1 || true
grep -R "leaders_only" supabase/migrations/202609040011_player_development_workflow.sql
grep -R "is_leader()" supabase/migrations/202609040011_player_development_workflow.sql
```

Expected: no service-role key in shipped browser/SQL code; migration contains leaders-only and leader authorization clauses.

- [ ] **Step 3: Inspect branch diff for scope creep**

```bash
git diff main...HEAD --stat
git diff main...HEAD -- index.html role-permissions.js coach-roster-summary.js development.js
```

Expected: no unrelated News, Calendar, Administration, or push-notification changes.

- [ ] **Step 4: Push only after local green verification**

```bash
git push -u origin <implementation-branch>
```

Do not push an intentionally failing TDD state.

- [ ] **Step 5: Wait for GitHub Actions and verify the exact head SHA**

Confirm the PR/head commit's workflow run completes successfully before recommending merge.

- [ ] **Step 6: Apply migration 011 manually in Supabase after code is merged/deployed in the agreed rollout order**

Because this environment has no live Supabase connector, provide the exact full contents of `supabase/migrations/202609040011_player_development_workflow.sql` for the user to paste into Supabase SQL Editor in one block. Do not claim the feature is live until Supabase reports `Success` and the user verifies the live flow.

- [ ] **Step 7: Live acceptance test**

Use one Coach/Admin and one linked Player account:

```text
1. Coach worklist shows the player and correct 28-day status.
2. Coach registers a player-visible follow-up with a required comment.
3. Player sees red dot on Utveckling after reload/sign-in.
4. Player opens the exact feedback; NYTT disappears for that item and dot clears when no unread items remain.
5. Coach creates Endast ledare note; Player never sees it and receives no dot.
6. Coach proposes a goal; Player sees proposal and red dot.
7. Player chooses GODKÄNN; proposed goal becomes active and previous goal remains history.
8. Repeat with another proposal and BEHÅLL MITT MÅL; active goal remains unchanged.
9. Parent account cannot open personal development data.
```

Only after these checks may the workflow be described as verified live.

---

## Self-Review

- **Spec coverage:** The plan covers the coach worklist, exact 28-day rule, meaningful recent activity, player-owned active goal, leader proposals, accepted/rejected state transitions, mandatory-comment follow-ups, player-visible versus leaders-only data, reusable unread notifications, red dot/read behavior, role UI visibility, Supabase RLS/RPC enforcement, CI coverage, and manual live migration verification.
- **Placeholder scan:** No `TBD`, `TODO`, `implement later`, or unspecified test/error steps remain.
- **Type/name consistency:** The same table names, RPC names, visibility values, proposal statuses, filter keys, and browser module names are used throughout all tasks.
- **Scope check:** Push delivery, parent development access, exercise recommendations, analytics, AI suggestions, and unrelated app areas remain excluded as required by the spec.
