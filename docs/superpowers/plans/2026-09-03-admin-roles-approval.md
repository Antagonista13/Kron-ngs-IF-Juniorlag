# Admin, roller och godkännande Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg ett säkert roll-, godkännande- och inbjudningssystem där Admin styr åtkomst, Ledare delar tränarbehörighet, Spelare får spelarflödet, Föräldrar endast ser gemensam laginformation och nya konton börjar som `pending`.

**Architecture:** En gemensam klientmodul definierar roll- och funktionsbehörigheter, medan Supabase RLS och `security definer`-RPC:er är den verkliga säkerhetsgränsen. Profiler utökas med `parent`, `pending`, visningstitel och aktivstatus; Admin får en separat mobilanpassad administrationsvy och e-postinbjudningar skickas server-side via en Supabase Edge Function så att service role-nyckeln aldrig hamnar i webbläsaren.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Supabase Auth + JavaScript client, PostgreSQL/RLS/RPC, Supabase Edge Functions (Deno/TypeScript), Node 22 `node:test`/`assert`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-03-admin-roles-approval-design.md`

## Global Constraints

- Systemroller är exakt `admin`, `coach`, `player`, `parent`, `pending`.
- Okänd eller saknad roll behandlas som `pending`/default deny.
- Endast `admin` får hantera användare och roller.
- Vanligt godkännandeflöde får endast tilldela `player`, `parent` eller `coach`; aldrig `admin`.
- `coach` och `admin` har samma ledarbehörighet för spelartrupp, laginnehåll och spelarutveckling.
- `parent` får läsa Nyheter och Kalender men inte spelarregister, spelarutveckling, Veckans fokus eller Veckans utmaning.
- `pending` får inte läsa internt laginnehåll.
- Player och Parent är read-only i Kalendern. Nuvarande Kalender är redan en read-only SportAdmin-feed; ingen ny kalendereditor eller kalenderdatabas byggs i denna leverans.
- En `parent` kopplas aldrig till en spelarpost.
- En `player` måste vid godkännande kopplas till exakt en befintlig aktiv rad i `public.players`.
- Visningstitel är separat från systemroll.
- Befintliga aktiva användare får inte låsas ute när migrationerna införs.
- Admins befintliga adminroll får inte kunna tas bort via det vanliga användarformuläret/RPC-flödet.
- Ingen personlig e-postadress, auth-ID eller Supabase service role-nyckel får hårdkodas i klientkod eller migrationer.
- Inbjudningslänk ger aldrig behörighet; mottagaren är `pending` tills Admin godkänner.
- Ingen import av föräldrauppgifter från de tidigare Excel-filerna.
- TDD körs RED → GREEN innan PR öppnas. Ingen PR skapas medan någon av de avsedda testerna är röd, för att undvika GitHub-felmejl från avsiktliga RED-körningar.
- Live-Supabase och Edge Function kan inte deployas automatiskt från denna konversation; filer skapas i repot och live-stegen verifieras separat efter att användaren har applicerat/deployat dem.

---

### Task 1: Central klientbehörighet med default deny

**Files:**
- Create: `role-permissions.js`
- Create: `tests/role-permissions.test.js`
- Modify: `development-role.js`
- Modify: `tests/development-role.test.js`

**Interfaces:**
- Produces: `normalizeRole(role) -> 'admin'|'coach'|'player'|'parent'|'pending'`.
- Produces: `isActiveRole(role) -> boolean`.
- Produces: `isLeaderRole(role) -> boolean`.
- Produces: `canViewNews(role)`, `canViewCalendar(role)`, `canViewWeeklyFocus(role)`, `canViewWeeklyChallenge(role)`, `canViewOwnDevelopment(role)`, `canViewRoster(role)`, `canManageTeamContent(role)`, `canManageUsers(role)`, `canViewAdministration(role)`.
- `development-role.js` consumes `isLeaderRole` semantics so både `coach` och `admin` får ledarens utvecklingsvy medan endast `player` får självskattningskorten.

- [ ] **Step 1: Write the failing role matrix test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('../role-permissions.js');

test('role matrix is default deny', () => {
  assert.equal(p.normalizeRole('unknown'), 'pending');
  assert.equal(p.isLeaderRole('admin'), true);
  assert.equal(p.isLeaderRole('coach'), true);
  assert.equal(p.isLeaderRole('player'), false);
  assert.equal(p.canViewNews('parent'), true);
  assert.equal(p.canViewCalendar('parent'), true);
  assert.equal(p.canViewWeeklyFocus('parent'), false);
  assert.equal(p.canViewWeeklyChallenge('parent'), false);
  assert.equal(p.canViewOwnDevelopment('parent'), false);
  assert.equal(p.canViewRoster('parent'), false);
  assert.equal(p.canManageUsers('admin'), true);
  assert.equal(p.canManageUsers('coach'), false);
  assert.equal(p.canViewNews('pending'), false);
  assert.equal(p.canViewNews(null), false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/role-permissions.test.js`

Expected: FAIL because `role-permissions.js` does not exist.

- [ ] **Step 3: Implement the minimal permission module**

Implement an immutable role set and explicit functions. `normalizeRole()` must return `pending` for null, blank and unknown values. Do not infer rights from display titles.

```js
const ACTIVE_ROLES = new Set(['admin','coach','player','parent']);
const LEADER_ROLES = new Set(['admin','coach']);
function normalizeRole(role){ return ['admin','coach','player','parent','pending'].includes(role) ? role : 'pending'; }
function isActiveRole(role){ return ACTIVE_ROLES.has(normalizeRole(role)); }
function isLeaderRole(role){ return LEADER_ROLES.has(normalizeRole(role)); }
function canViewNews(role){ return isActiveRole(role); }
function canViewCalendar(role){ return isActiveRole(role); }
function canViewWeeklyFocus(role){ return ['admin','coach','player'].includes(normalizeRole(role)); }
function canViewWeeklyChallenge(role){ return canViewWeeklyFocus(role); }
function canViewOwnDevelopment(role){ return ['admin','coach','player'].includes(normalizeRole(role)); }
function canViewRoster(role){ return isLeaderRole(role); }
function canManageTeamContent(role){ return isLeaderRole(role); }
function canManageUsers(role){ return normalizeRole(role)==='admin'; }
function canViewAdministration(role){ return canManageUsers(role); }
```

Export for Node and attach as `window.KronangPermissions` in browser.

- [ ] **Step 4: Update development role semantics and tests**

Change `getDevelopmentHeading()` so `coach` and `admin` both receive `Juniorlagets utveckling`. Explicitly assert `parent` and `pending` cannot edit or see player development cards.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/role-permissions.test.js tests/development-role.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add role-permissions.js development-role.js tests/role-permissions.test.js tests/development-role.test.js
git commit -m "feat: centralize app role permissions"
```

### Task 2: Profilroller, pending-status och säkra databashelpers

**Files:**
- Create: `supabase/migrations/202609030007_admin_roles_and_invitations.sql`
- Create: `tests/admin-role-schema.test.js`

**Interfaces:**
- Extends `public.profiles` with `display_title text` and `is_active boolean not null default true`.
- Ensures `profiles.role` accepts exactly `admin|coach|player|parent|pending`.
- Produces `public.current_profile_role() -> text`, `public.current_profile_active() -> boolean`, `public.is_admin() -> boolean`, `public.is_leader() -> boolean`.
- Produces `public.user_invitations(id,email,display_name,expected_role,status,invited_by,created_at,updated_at)`.
- Produces auth-user trigger `public.handle_new_kronang_user()` that creates a new profile as `pending` without altering existing profiles.

- [ ] **Step 1: Write failing static schema tests**

```js
const fs = require('fs');
const assert = require('assert');
const sql = fs.readFileSync('supabase/migrations/202609030007_admin_roles_and_invitations.sql','utf8').toLowerCase();
['admin','coach','player','parent','pending'].forEach(role => assert.ok(sql.includes("'"+role+"'")));
assert.ok(sql.includes('display_title'));
assert.ok(sql.includes('is_active'));
assert.ok(sql.includes('user_invitations'));
assert.ok(sql.includes('is_admin'));
assert.ok(sql.includes('is_leader'));
assert.ok(sql.includes("'pending'"));
assert.ok(!sql.includes('service_role'));
```

- [ ] **Step 2: Run and verify RED**

Run: `node tests/admin-role-schema.test.js`

Expected: FAIL because migration does not exist.

- [ ] **Step 3: Add idempotent profile migration**

Add `display_title` and `is_active`. Preserve existing rows as active. Replace the role CHECK constraint by finding check constraints on `public.profiles` whose definition references `role`, dropping them in a `DO $$ ... $$` block, then add named constraint:

```sql
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin','coach','player','parent','pending'));
```

Do not change existing role values.

- [ ] **Step 4: Add canonical SQL permission helpers**

Functions use `auth.uid()` and `public.profiles`; `is_admin()` is true only when role is `admin` and `is_active=true`; `is_leader()` is true only for `admin|coach` and active. Mark them `stable security definer set search_path=public` and revoke public execute before granting to `authenticated` where required.

- [ ] **Step 5: Add invitation table and RLS**

`expected_role` accepts null or `player|parent|coach`; status accepts `pending|accepted|rejected`. Only active admins can select/insert/update invitations. No player/parent/coach broad policy.

- [ ] **Step 6: Add pending-profile auth trigger**

Create `handle_new_kronang_user()` on `auth.users after insert`. It inserts `id`, `full_name` from `raw_user_meta_data->>'full_name'`, team `Kronängs IF Juniorlag`, role `pending`, `is_active=true`; use `on conflict (id) do nothing` so existing profiles are never overwritten. If `full_name` is empty, use `Nytt konto` so a non-null profile name does not break signup.

- [ ] **Step 7: Run schema test and verify GREEN**

Run: `node tests/admin-role-schema.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/202609030007_admin_roles_and_invitations.sql tests/admin-role-schema.test.js
git commit -m "feat: add pending roles and invitation schema"
```

### Task 3: Admin-only listning, godkännande och rolländring via RPC

**Files:**
- Create: `supabase/migrations/202609030008_admin_user_rpcs.sql`
- Create: `tests/admin-user-rpcs.test.js`

**Interfaces:**
- Produces `admin_list_users()` returning `profile_id,email,full_name,role,display_title,is_active,player_id,invitation_status,expected_role`.
- Produces `admin_approve_user(p_profile_id uuid,p_role text,p_player_id uuid default null,p_display_title text default null)`.
- Produces `admin_reject_user(p_profile_id uuid)`.
- Produces `admin_update_user_access(p_profile_id uuid,p_role text,p_player_id uuid default null,p_display_title text default null,p_is_active boolean default true)`.
- Every RPC starts with an active-admin check through `public.is_admin()`.

- [ ] **Step 1: Write failing RPC security tests**

Static test must assert the SQL contains all four function names, `public.is_admin()`, allowed target-role check for only `player|parent|coach`, player-link updates on `public.players`, and explicit rejection of changing a target whose existing role is `admin`.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/admin-user-rpcs.test.js`

Expected: FAIL because migration does not exist.

- [ ] **Step 3: Implement `admin_list_users()`**

Use `security definer set search_path=public,auth`. Join `auth.users u` to `public.profiles p`, left join `public.players pl on pl.profile_id=p.id`, and left join the newest invitation matching `lower(email)`. Return only after `if not public.is_admin() then raise exception 'Endast Admin...'`.

- [ ] **Step 4: Implement approval transaction**

Validate `p_role in ('player','parent','coach')`. If `player`, require non-null `p_player_id`, lock the player row, require `is_active=true` and `profile_id is null or profile_id=p_profile_id`, clear any previous player link for that profile, then set chosen `players.profile_id=p_profile_id`. If `parent` or `coach`, clear any previous player link. Update profile role, display title only for coach, and `is_active=true`. Mark matching pending invitation `accepted`.

- [ ] **Step 5: Implement reject/update guards**

`admin_reject_user` accepts only a non-admin target, leaves role as `pending`, sets `is_active=false`, and marks invitation rejected. `admin_update_user_access` refuses any target whose current role is `admin`, accepts only `player|parent|coach`, applies the same player-link invariant, and updates title/active status. This protects the current Admin and future admins from accidental demotion through ordinary controls.

- [ ] **Step 6: Lock execution grants**

Revoke all four RPCs from `public`; grant execute only to `authenticated`. Authorization still happens inside the functions.

- [ ] **Step 7: Run test and verify GREEN**

Run: `node tests/admin-user-rpcs.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/202609030008_admin_user_rpcs.sql tests/admin-user-rpcs.test.js
git commit -m "feat: add secure admin user management rpcs"
```

### Task 4: RLS-härdning för Parent, Pending och Admin-ledarbehörighet

**Files:**
- Create: `supabase/migrations/202609030009_permissions_rls.sql`
- Create: `tests/permissions-sql.test.js`

**Interfaces:**
- Uses `public.current_profile_active()`, `public.is_admin()`, `public.is_leader()` from Task 2.
- Replaces policies for `players`, `team_posts`, `team_focus`, `team_challenges`, `challenge_completions`, `team_staff`, `development_goals`, `development_focuses`, `development_subgoals` and development assessment tables that exist in the current schema.
- Parent: team posts + team staff only among Supabase team content; no focus/challenge/player/development data.
- Pending/disabled: no team content.
- Player: own development/player row + team posts/focus/challenge/staff.
- Coach/Admin: leader reads/writes required by app.

- [ ] **Step 1: Write failing policy test**

The test reads the new migration and asserts it contains explicit role predicates for `parent`, `pending`, `player`, `coach`, `admin`; `players` policies use `public.is_leader()` or own player profile; `team_focus` and `team_challenges` select predicates allow only `admin|coach|player`; `team_posts` allows active `parent`; and development policies include leader read plus player-own read.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/permissions-sql.test.js`

Expected: FAIL because migration does not exist.

- [ ] **Step 3: Replace player and team-content policies**

Drop current named policies and recreate them with active-role checks. Keep player roster write access to leaders only. Team posts are readable by all active roles and writable only by leaders. Team focus/challenge are readable only by active `admin|coach|player`, writable only by leaders. Challenge completion remains player-own only.

- [ ] **Step 4: Harden team staff**

Allow same-team reads only to active roles. Parent may continue seeing the published leader contact block because it is team-common information; `pending` and disabled accounts cannot query it.

- [ ] **Step 5: Harden development data**

For `development_goals`, `development_focuses`, `development_subgoals` and existing assessment-related tables: player may read own data, active leader may read player data required by coach workspace, parent/pending receive no policy. Preserve existing secure player RPC write paths; do not grant parents direct table writes.

- [ ] **Step 6: Run policy test and verify GREEN**

Run: `node tests/permissions-sql.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/202609030009_permissions_rls.sql tests/permissions-sql.test.js
git commit -m "security: enforce role permissions in supabase rls"
```

### Task 5: Självregistrering och access gate för Pending/Parent

**Files:**
- Create: `access-gate.js`
- Create: `access-gate.css`
- Create: `tests/access-gate.test.js`
- Modify: `auth.js`
- Modify: `index.html`

**Interfaces:**
- Produces `buildAccessState(profile) -> {status:'active'|'pending'|'disabled', role, allowedPages:string[]}`.
- Produces `allowedPagesForRole(role)`.
- Active Parent pages: `homePage`, `calendarPage`, `teamPage`, `profilePage`.
- Player pages: all existing five pages.
- Coach/Admin pages: all existing five pages; Admin additionally gets separate admin entry/page in Task 7.
- Pending/disabled users see only a blocking status screen + logout.

- [ ] **Step 1: Write failing access-state tests**

Assert parent does not get `developmentPage`; pending gets zero app pages; disabled active-role profile gets `status='disabled'`; player/coach/admin get Development. Unknown role resolves to pending.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/access-gate.test.js`

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement access gate before exposing app**

On session resolve and `kronang:auth-signed-in`, fetch `role,is_active`. While unresolved, use `body.access-resolving` to hide `.container` and `.bottom-nav`. For pending/disabled render a fixed `#accessStatusScreen`, keep app hidden, and provide logout using existing Supabase auth. For active users, remove blocking screen and hide nav buttons/pages not in `allowedPagesForRole()`.

- [ ] **Step 4: Add signup form to existing auth UI**

Extend `auth.js` with a toggle `Skapa konto`. Signup fields are name, e-mail and password. Use:

```js
supabaseClient.auth.signUp({
  email,
  password,
  options:{ data:{ full_name:name.trim() } }
});
```

After success, display `Kontot är skapat och väntar på godkännande.` Do not assign role from browser metadata.

- [ ] **Step 5: Wire scripts/styles in `index.html`**

Load `role-permissions.js` before modules that consume it, then `access-gate.js`; add `access-gate.css`. Keep existing five-item bottom navigation; Parent simply has Development hidden rather than creating a replacement nav layout.

- [ ] **Step 6: Run tests and syntax checks**

Run: `node --check auth.js && node --check access-gate.js && node --test tests/access-gate.test.js tests/auth-navigation.test.js tests/auth-password.test.js`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add auth.js access-gate.js access-gate.css index.html tests/access-gate.test.js
git commit -m "feat: add pending signup and app access gate"
```

### Task 6: Tillämpa rollmatrisen på Home, Laget, Spelartrupp och Utveckling

**Files:**
- Modify: `home-player-header.js`
- Modify: `team-focus.js`
- Modify: `team-challenge.js`
- Modify: `team-posts.js`
- Modify: `player-roster.js`
- Modify: `coach.js`
- Modify: `logout.js`
- Modify: `tests/home-player-header.test.js`
- Modify: `tests/team-posts.test.js`
- Modify: `tests/team-challenge.test.js`
- Modify: `tests/player-roster.test.js`
- Create: `tests/role-content-visibility.test.js`

**Interfaces:**
- Consumes `window.KronangPermissions` / CommonJS exports from Task 1.
- Produces `getHomeVisibleCards(role)` for deterministic tests.
- Produces `getAccountRoleLabel(role,displayTitle)` for Profile account text.

- [ ] **Step 1: Write failing visibility regressions**

Assert Parent gets next activity + news but not focus/challenge; Player gets all four; pending gets none. Assert `canManageTeamPosts`, `canManageTeamChallenge`, `canManageRoster` are false for parent/pending. Assert Admin satisfies the leader predicate used by coach workspace.

- [ ] **Step 2: Run and verify RED**

Run the new visibility test plus the existing role tests. Expected: FAIL until modules consume central permissions.

- [ ] **Step 3: Gate Home cards**

After loading profile, hide `.home-focus` unless `canViewWeeklyFocus(role)` and hide `#homeChallengeCard` unless `canViewWeeklyChallenge(role)`. News/activity remain for active parent. Do not merely rely on RLS to leave empty cards visible.

- [ ] **Step 4: Gate Laget modules**

`team-focus.js` and `team-challenge.js` must return before loading/rendering for Parent. `team-posts.js` keeps read visibility for Parent but composer/edit/delete only for leader. `player-roster.js` remains leader-only. Keep `team-staff.js` visible for active roles.

- [ ] **Step 5: Give Admin full coach workspace**

Replace `profile.role !== 'coach'` guards in `coach.js` with leader predicate. Ensure Admin gets the same player-development workspace and no self-assessment editing. Do not duplicate a second Admin development implementation.

- [ ] **Step 6: Make Profile role text accurate**

Update `logout.js`/account card labels: admin uses display title fallback `Admin`, coach uses display title fallback `Ledare`, player `Spelare`, parent `Förälder`, pending `Väntar på godkännande`.

- [ ] **Step 7: Run affected tests and verify GREEN**

Run:

```bash
node --test tests/role-content-visibility.test.js tests/team-posts.test.js tests/team-challenge.test.js tests/development-role.test.js
node tests/player-roster.test.js
node tests/home-player-header.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add home-player-header.js team-focus.js team-challenge.js team-posts.js player-roster.js coach.js logout.js tests
git commit -m "feat: enforce role visibility across app"
```

### Task 7: Adminvy, godkännandekö och användarhantering

**Files:**
- Create: `admin-access.js`
- Create: `admin-page.js`
- Create: `admin-page.css`
- Create: `tests/admin-access.test.js`
- Create: `tests/admin-page-model.test.js`
- Modify: `index.html`

**Interfaces:**
- Produces `validateApproval({role,playerId,displayTitle}) -> {ok,message,value}`.
- Produces `validateInvite({email,fullName,expectedRole})`.
- Produces `buildAdminUserModel(row)`.
- Browser calls `rpc('admin_list_users')`, `rpc('admin_approve_user',...)`, `rpc('admin_reject_user',...)`, `rpc('admin_update_user_access',...)`.

- [ ] **Step 1: Write failing pure admin tests**

Test that player approval without `playerId` fails; parent with playerId strips/ignores the link; coach title is optional; admin/pending are rejected as approval target roles; malformed email fails; expected role may only be blank/player/parent/coach; target admin model reports `locked=true`.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/admin-access.test.js tests/admin-page-model.test.js`

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Build separate Admin page without sixth bottom-nav item**

Add `<section class="page" id="adminPage">` containing header/back control and hosts for overview, approvals, users and invite form. Add an `Administration` card/button inside Profile that is created/unhidden only for Admin. This avoids crowding mobile bottom navigation with a sixth permanent icon.

- [ ] **Step 4: Render overview and approval queue**

Call `admin_list_users()`. Build counts: pending active/inactive awaiting decision, active users, leaders (`coach|admin`). For each pending profile, render role selector with Player/Förälder/Ledare. If Player is selected, load active unlinked `public.players` rows and require one. If Coach, reveal display-title field. Buttons: `GODKÄNN` and `NEKA`.

- [ ] **Step 5: Render active users**

Show name, email, system role, display title and active state. Non-admin users can be edited through `admin_update_user_access`. Admin rows display a locked badge and no ordinary role/demotion controls.

- [ ] **Step 6: Add mobile styling**

Use existing visual language: light background, white 18–20px radius cards, black primary buttons, subtle `#d1aa67` accents, 44px minimum touch targets, no horizontal overflow at 320px.

- [ ] **Step 7: Run tests and syntax checks**

Run: `node --check admin-access.js && node --check admin-page.js && node --test tests/admin-access.test.js tests/admin-page-model.test.js`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add admin-access.js admin-page.js admin-page.css index.html tests/admin-access.test.js tests/admin-page-model.test.js
git commit -m "feat: add admin approval and user management view"
```

### Task 8: Säker e-postinbjudan via Supabase Edge Function

**Files:**
- Create: `supabase/functions/invite-user/index.ts`
- Create: `tests/invite-function.test.js`
- Modify: `admin-page.js`

**Interfaces:**
- Client: `supabase.functions.invoke('invite-user',{body:{email,fullName,expectedRole}})`.
- Edge Function body: `{email:string, fullName:string, expectedRole:''|'player'|'parent'|'coach'}`.
- Function validates caller JWT, then verifies caller profile has `role='admin'` and `is_active=true` before using service-role client.
- Service client calls `auth.admin.inviteUserByEmail(email,{data:{full_name:fullName}})` and writes `user_invitations`.

- [ ] **Step 1: Write failing security test**

Static test reads the Edge Function and asserts it checks caller authorization/admin profile before `inviteUserByEmail`, uses `SUPABASE_SERVICE_ROLE_KEY` only in the Edge Function, validates expectedRole, and that no client `.js` file contains `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/invite-function.test.js`

Expected: FAIL because Edge Function does not exist.

- [ ] **Step 3: Implement Edge Function**

Use the request `Authorization` header to create a user-context Supabase client with anon key, call `auth.getUser()`, fetch the caller profile, reject unless active admin, validate email/name/expectedRole, then create a separate service-role client from `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`. Send the Supabase invite and upsert invitation metadata. Never return service credentials in errors or response.

- [ ] **Step 4: Connect Admin invite form**

On submit, run `validateInvite`, invoke the function, disable button while sending and show clear success/error copy. No role is written to the invited profile from the browser.

- [ ] **Step 5: Run security test and syntax-relevant client tests**

Run: `node tests/invite-function.test.js && node --check admin-page.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/invite-user/index.ts admin-page.js tests/invite-function.test.js
git commit -m "feat: add secure email invitations"
```

### Task 9: CI, full regression and PR-safe handoff

**Files:**
- Modify: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- CI runs all new permission/admin tests plus existing home/team/roster tests.
- Branch is PR-ready only after all tests are green.

- [ ] **Step 1: Extend CI syntax checks**

Add:

```bash
node --check role-permissions.js
node --check access-gate.js
node --check admin-access.js
node --check admin-page.js
```

- [ ] **Step 2: Add new tests to CI**

Add commands for:

```bash
node --test tests/role-permissions.test.js
node tests/admin-role-schema.test.js
node tests/admin-user-rpcs.test.js
node tests/permissions-sql.test.js
node --test tests/access-gate.test.js
node --test tests/role-content-visibility.test.js
node --test tests/admin-access.test.js tests/admin-page-model.test.js
node tests/invite-function.test.js
```

Also add the currently existing auth/development/team-challenge tests to CI if they are not already run, because this feature changes those paths.

- [ ] **Step 3: Run the complete workflow commands before opening PR**

Run every command from `.github/workflows/home-news-tests.yml` on the implementation branch. Expected: all PASS. Do not open a PR to demonstrate RED TDD state.

- [ ] **Step 4: Perform security grep**

Run:

```bash
grep -R "SUPABASE_SERVICE_ROLE_KEY" -- *.js tests 2>/dev/null && exit 1 || true
grep -R -Ei "personnummer|målsman|allergi" admin-*.js role-permissions.js access-gate.js supabase/migrations/20260903000{7,8,9}_*.sql 2>/dev/null && exit 1 || true
```

Expected: no sensitive-data leakage in client/admin files; service role identifier appears only inside Edge Function/deployment docs where intended.

- [ ] **Step 5: Manual UI verification before PR**

With mocked/test accounts or after staging migration deployment verify: Admin sees Administration; Coach does not; Parent sees Hem/Kalender/Laget/Profil but no Utveckling, focus, challenge or roster; Player retains current five views; Pending sees only waiting screen; disabled account sees blocked screen.

- [ ] **Step 6: Open PR only after GREEN**

Create a PR from the implementation branch to `main`. PR body must clearly state that migrations `007–009` and Edge Function `invite-user` require live Supabase application/deployment before the feature is fully active.

- [ ] **Step 7: Verify GitHub Actions**

Require workflow conclusion `success` before recommending merge.

- [ ] **Step 8: Live deployment handoff**

After code merge/approval, provide the user the SQL files in exact order `007`, `008`, `009` for Supabase SQL Editor and the exact Edge Function deployment/configuration steps. After the user confirms those succeed, verify the Admin flow in the live app. Never claim live RLS/invite deployment before that confirmation.

- [ ] **Step 9: Finish branch**

Use `superpowers:finishing-a-development-branch`. Recommend the safe merge/PR option based on verified green CI, and do not create a red draft PR.