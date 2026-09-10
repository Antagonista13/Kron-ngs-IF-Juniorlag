# Split Main App Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the oversized `Home and news tests` pull-request workflow into smaller domain-specific blocking checks without reducing coverage or changing application runtime code.

**Architecture:** Replace the single umbrella workflow with eight focused GitHub Actions workflows that all use Node 22 and the same checkout/setup baseline. Update the CI self-test so it validates the new critical workflow instead of the deleted umbrella file, then remove the old workflow only after every command has been mapped.

**Tech Stack:** GitHub Actions YAML, Node.js 22, Node built-in test runner, shell/grep checks.

**Spec:** `docs/superpowers/specs/2026-09-10-split-main-app-tests-design.md`

## Global Constraints

- No application code changes.
- No test files removed or weakened.
- Preserve all existing test commands and Node 22.
- Every test currently in `.github/workflows/home-news-tests.yml` must remain covered.
- Security leak checks stay blocking.
- Existing `player-phone-tests.yml`, `sportadmin-sync-tests.yml`, and `sportadmin-roster-daily.yml` remain untouched.
- New pull-request checks must be named by domain so failures are immediately attributable.

---

### Task 1: Make the CI self-test describe the new critical workflow

**Files:**
- Modify: `tests/ci-stability-coverage.test.js`
- Create: `.github/workflows/critical-app-checks.yml`

**Interfaces:**
- Consumes: the current syntax-check list and critical test commands from `home-news-tests.yml`.
- Produces: a blocking `Critical app checks` workflow and a CI test that verifies its key mobile bridge checks.

- [ ] **Step 1: Write the failing CI self-test**

Change `tests/ci-stability-coverage.test.js` to read `.github/workflows/critical-app-checks.yml` instead of `home-news-tests.yml`, while preserving the assertions for `leader-tools-profile.js`, `calendar-bridge.js`, and `tests/critical-flow-contract.test.js`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/ci-stability-coverage.test.js`
Expected: FAIL because `.github/workflows/critical-app-checks.yml` does not yet exist.

- [ ] **Step 3: Create the critical workflow**

Create `.github/workflows/critical-app-checks.yml` with:

```yaml
name: Critical app checks

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Syntax check
        run: |
          node --check home-player-header.js
          node --check team-posts.js
          if [ -f team-staff.js ]; then node --check team-staff.js; fi
          if [ -f profile-avatar.js ]; then node --check profile-avatar.js; fi
          if [ -f admin-profile-images.js ]; then node --check admin-profile-images.js; fi
          if [ -f admin-center.js ]; then node --check admin-center.js; fi
          if [ -f player-roster.js ]; then node --check player-roster.js; fi
          if [ -f player-profile-redesign.js ]; then node --check player-profile-redesign.js; fi
          node --check navigation-scroll.js
          node --check role-permissions.js
          node --check access-gate.js
          node --check admin-access.js
          node --check admin-page.js
          node --check development-role.js
          node --check development.js
          node --check development-workflow.js
          node --check development-profile.js
          node --check development-notifications.js
          node --check player-development-layout.js
          node --check coach-development-worklist.js
          node --check coach-player-page.js
          node --check calendar-management.js
          node --check calendar-runtime.js
          node --check calendar-bridge.js
          node --check profile-role-view.js
          node --check leader-tools-profile.js
      - name: CI stability coverage
        run: node --test tests/ci-stability-coverage.test.js
      - name: Critical mobile flow contract
        run: node --test tests/critical-flow-contract.test.js
      - name: Browser script compatibility tests
        run: node --test tests/browser-script-order.test.js
      - name: Navigation scroll tests
        run: node --test tests/navigation-scroll.test.js tests/navigation-player-detail-reset.test.js
```

- [ ] **Step 4: Run the self-test and critical commands**

Run:
```bash
node --test tests/ci-stability-coverage.test.js
node --test tests/critical-flow-contract.test.js
node --test tests/browser-script-order.test.js
node --test tests/navigation-scroll.test.js tests/navigation-player-detail-reset.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/ci-stability-coverage.test.js .github/workflows/critical-app-checks.yml
git commit -m "ci: add critical app checks workflow"
```

### Task 2: Split Home/News and Team/Roster coverage

**Files:**
- Create: `.github/workflows/home-news.yml`
- Create: `.github/workflows/team-roster.yml`

**Interfaces:**
- Consumes: exact existing commands from `home-news-tests.yml`.
- Produces: `Home and News` and `Team and Roster` blocking PR checks.

- [ ] **Step 1: Create `home-news.yml`**

Use the standard checkout + Node 22 preamble and preserve these exact commands:

```yaml
      - name: Home tests
        run: |
          node tests/home-player-header.test.js
          node tests/home-leader-label-style.test.js
      - name: Team post tests
        run: node --test tests/team-posts.test.js tests/team-post-compact.test.js
      - name: News 2.0 SQL tests
        run: node --test tests/team-post-editor-sql.test.js
      - name: Mobile home tests
        run: node tests/home-mobile-layout.test.js
      - name: Header polish tests
        run: node --test tests/header-polish.test.js
```

Workflow name: `Home and News`.

- [ ] **Step 2: Create `team-roster.yml`**

Preserve these exact commands:

```yaml
      - name: Team focus style tests
        run: node tests/team-focus-style.test.js
      - name: Team staff tests
        run: node --test tests/team-staff.test.js tests/team-staff-profile.test.js
      - name: Team staff 2.0 tests
        run: node --test tests/team-staff-admin-sql.test.js tests/team-staff-rpc-security.test.js tests/team-staff-admin-ui.test.js
      - name: Team player name size tests
        run: node tests/team-player-name-size.test.js
      - name: Player seed privacy tests
        run: node tests/player-seed-privacy.test.js
      - name: Player roster tests
        run: node tests/player-roster.test.js
      - name: Player nickname tests
        run: node tests/player-nickname.test.js
      - name: Player public profile tests
        run: node tests/player-public-profile.test.js
      - name: Player roster UI tests
        run: node --test tests/player-roster-ui.test.js tests/player-roster-open-profile.test.js
      - name: Player shirt number source tests
        run: node tests/player-shirt-number-source.test.js
```

Workflow name: `Team and Roster`.

- [ ] **Step 3: Run all moved commands locally**

Run every command listed above. Expected: all PASS on the branch baseline.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/home-news.yml .github/workflows/team-roster.yml
git commit -m "ci: split home news and roster checks"
```

### Task 3: Split Player/Profile, Coach/Leader, and Calendar coverage

**Files:**
- Create: `.github/workflows/player-profile.yml`
- Create: `.github/workflows/coach-leader.yml`
- Create: `.github/workflows/calendar.yml`

**Interfaces:**
- Consumes: exact development/profile/coach/calendar commands from the umbrella workflow.
- Produces: three independently failing PR checks.

- [ ] **Step 1: Create `player-profile.yml`**

Preserve these commands exactly:

```yaml
      - name: Profile avatar tests
        run: node tests/profile-avatar.test.js
      - name: Profile role tests
        run: node --test tests/profile-role-view.test.js tests/leader-about-me.test.js
      - name: Player profile redesign tests
        run: node --test tests/player-profile-redesign.test.js
      - name: Profile image 2.0 tests
        run: node --test tests/profile-image-admin.test.js tests/profile-image-sql.test.js tests/player-profile-image-sql.test.js tests/admin-profile-images.test.js
      - name: Profile data fallback tests
        run: node tests/profile-data-fallback.test.js
      - name: Development role tests
        run: node --test tests/development-role.test.js tests/development-asset-loading.test.js tests/development-area-icons.test.js
      - name: Player development workflow tests
        run: node --test tests/development-workflow.test.js tests/development-profile.test.js tests/development-notifications.test.js tests/player-development-sql.test.js tests/player-development-assets.test.js tests/player-development-layout.test.js
      - name: Player focus edit tests
        run: node --test tests/player-focus-edit.test.js tests/player-focus-edit-duplicates.test.js
      - name: Player main goal SQL tests
        run: node --test tests/player-main-goal-sql.test.js
      - name: Player main goal UI tests
        run: node --test tests/player-main-goal-ui.test.js
      - name: Team challenge tests
        run: node --test tests/team-challenge.test.js
      - name: Role permission tests
        run: node --test tests/role-permissions.test.js
```

Workflow name: `Player and Profile`.

- [ ] **Step 2: Create `coach-leader.yml`**

```yaml
      - name: Leader development compact tests
        run: node --test tests/leader-development-compact.test.js tests/leader-development-compact-assets.test.js
      - name: Coach main goal review tests
        run: node --test tests/coach-main-goal-review.test.js
      - name: Coach player profile 2 tests
        run: node --test tests/coach-player-profile-2.test.js
```

Workflow name: `Coach and Leader`.

- [ ] **Step 3: Create `calendar.yml`**

```yaml
      - name: Calendar 2.0 tests
        run: node --test tests/calendar.test.js
```

Workflow name: `Calendar`.

- [ ] **Step 4: Run all moved commands locally**

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/player-profile.yml .github/workflows/coach-leader.yml .github/workflows/calendar.yml
git commit -m "ci: split player coach and calendar checks"
```

### Task 4: Split Admin/Access and Security coverage

**Files:**
- Create: `.github/workflows/admin-access.yml`
- Create: `.github/workflows/security-checks.yml`

**Interfaces:**
- Consumes: exact admin/auth/permissions/invite and static security commands from the umbrella workflow.
- Produces: `Admin and Access` and `Security checks` blocking PR checks.

- [ ] **Step 1: Create `admin-access.yml`**

Preserve these commands exactly:

```yaml
      - name: Auth tests
        run: node --test tests/auth-navigation.test.js tests/auth-password.test.js tests/invite-onboarding-mobile.test.js
      - name: Admin role schema tests
        run: node tests/admin-role-schema.test.js
      - name: Admin user RPC tests
        run: node tests/admin-user-rpcs.test.js
      - name: Admin save timestamp SQL tests
        run: node --test tests/admin-save-feedback-sql.test.js
      - name: Admincenter tests
        run: node --test tests/admin-center.test.js tests/admin-center-sql.test.js
      - name: Admin cleanup round tests
        run: node tests/admin-cleanup-round.test.js
      - name: Reinvite and invite role label tests
        run: node tests/reinvite-and-invite-role-labels.test.js
      - name: Permission SQL tests
        run: node tests/permissions-sql.test.js
      - name: Access gate tests
        run: node --test tests/access-gate.test.js
      - name: Role content visibility tests
        run: node --test tests/role-content-visibility.test.js
      - name: Admin view tests
        run: node --test tests/admin-access.test.js tests/admin-page-model.test.js tests/admin-invite-loader.test.js tests/admin-field-visibility.test.js tests/admin-account-linking-ux.test.js tests/admin-linked-player-options.test.js
      - name: Admin approval tests
        run: node tests/admin-approval-email.test.js
      - name: Invite function tests
        run: node tests/invite-function.test.js
```

Workflow name: `Admin and Access`.

- [ ] **Step 2: Create `security-checks.yml`**

Copy the three existing `grep` guards verbatim from the current `Security leak checks` step. Workflow name: `Security checks`.

- [ ] **Step 3: Run the admin commands and security shell guards locally**

Expected: PASS / exit code 0.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/admin-access.yml .github/workflows/security-checks.yml
git commit -m "ci: split admin access and security checks"
```

### Task 5: Prove full coverage before removing the umbrella workflow

**Files:**
- Modify: `tests/ci-stability-coverage.test.js`
- Delete: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- Consumes: all eight new workflow files.
- Produces: a repository-level guard that prevents accidental loss of the CI split's critical structure.

- [ ] **Step 1: Extend `ci-stability-coverage.test.js`**

Add assertions that all eight files exist and have the expected workflow names:

```js
const expected={
  'critical-app-checks.yml':'Critical app checks',
  'home-news.yml':'Home and News',
  'team-roster.yml':'Team and Roster',
  'player-profile.yml':'Player and Profile',
  'coach-leader.yml':'Coach and Leader',
  'calendar.yml':'Calendar',
  'admin-access.yml':'Admin and Access',
  'security-checks.yml':'Security checks'
};
for(const [file,name] of Object.entries(expected)){
  const source=fs.readFileSync('.github/workflows/'+file,'utf8');
  assert.match(source,new RegExp('name: '+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(source,/node-version: ['"]22['"]/);
}
```

For `security-checks.yml`, if setup-node is intentionally unnecessary, exempt it from the Node-version assertion while still asserting checkout and the security guards.

- [ ] **Step 2: Run the self-test**

Run: `node --test tests/ci-stability-coverage.test.js`
Expected: PASS with all eight files present.

- [ ] **Step 3: Compare old and new command inventories**

Extract every `run:` command and multiline shell command from `home-news-tests.yml`, compare with the combined new workflows, and verify every old command is present exactly once except the deliberate `ci-stability-coverage.test.js`/critical self-reference inside the critical workflow.

Expected: no missing test command and no accidental duplicate domain test execution.

- [ ] **Step 4: Delete the old workflow**

Remove `.github/workflows/home-news-tests.yml` only after Step 3 is clean.

- [ ] **Step 5: Re-run CI self-test after deletion**

Run: `node --test tests/ci-stability-coverage.test.js`
Expected: PASS and no reference to `home-news-tests.yml` remains.

- [ ] **Step 6: Commit**

```bash
git add tests/ci-stability-coverage.test.js .github/workflows
git commit -m "ci: retire umbrella home news workflow"
```

### Task 6: Final verification and PR

**Files:**
- Verify only; no runtime application files may be changed.

**Interfaces:**
- Consumes: completed CI split.
- Produces: PR evidence that failures are isolated by domain.

- [ ] **Step 1: Verify changed-file scope**

Confirm the diff contains only:
- `.github/workflows/*.yml`
- `tests/ci-stability-coverage.test.js`
- `docs/superpowers/specs/2026-09-10-split-main-app-tests-design.md`
- `docs/superpowers/plans/2026-09-10-split-main-app-tests-implementation-plan.md`

- [ ] **Step 2: Run the full command set represented by all new workflows**

Execute all commands from the eight new workflow files locally. Expected: no failures attributable to the CI split itself. Existing baseline product-test failures, if any, must be reported rather than hidden.

- [ ] **Step 3: Validate workflow YAML structure**

Parse all new `.github/workflows/*.yml` files with an available YAML parser or equivalent syntax validation. Expected: all parse successfully.

- [ ] **Step 4: Open a pull request**

Title: `Split main app CI tests by domain`

Body must state:
- no runtime app code changed;
- old coverage preserved;
- eight new named checks replace the umbrella workflow;
- existing SportAdmin and phone-privacy workflows are untouched.

- [ ] **Step 5: Inspect GitHub Actions results**

Expected pull-request statuses include `Critical app checks`, `Home and News`, `Team and Roster`, `Player and Profile`, `Coach and Leader`, `Calendar`, `Admin and Access`, `Security checks`, plus existing dedicated workflows.

- [ ] **Step 6: Verify isolation**

If a domain fails, confirm only that named workflow is red while unrelated domains can complete green. Do not merge until the CI split itself is structurally validated and all failures are understood.
