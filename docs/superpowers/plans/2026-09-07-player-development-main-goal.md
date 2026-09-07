# Player Development Main Goal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicate player goal/profile presentations with one player-owned HUVUDMÅL workflow that supports draft, coach review, approval, and later history.

**Architecture:** Extend the existing development goal/proposal data model rather than create a parallel goal system. Put the player-facing state machine behind focused RPCs and one focused frontend owner for HUVUDMÅL; adapt coach review to the same records. Keep later Focus/Assessment/Trend/History work out of this stage.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Supabase PostgreSQL/RPC/RLS, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-player-development-redesign-design.md`

## Global Constraints
- Stage 1 changes HUVUDMÅL only.
- Player owns the goal; coach approves or returns it with a comment.
- Player states shown as UTKAST, VÄNTAR PÅ TRÄNARE, GODKÄNT.
- No duplicate Utvecklingsprofil/approved-goal surface on the player page.
- Preserve existing useful goal details and completed/replaced records.
- Do not refactor Calendar bridge or unrelated navigation.
- Use TDD and a fresh green GitHub Actions run before merge.

---

### Task 1: Define and secure main-goal approval state

**Files:**
- Create: `supabase/migrations/202609070001_player_owned_main_goal_approval.sql`
- Test: extend the existing development SQL test suite or add `tests/player-main-goal-sql.test.js` and wire it explicitly into `.github/workflows/home-news-tests.yml`.

**Interfaces:**
- Produces player RPCs for saving/submitting a player-owned main goal.
- Produces leader RPC for approving or returning a submitted goal.
- Preserves `development_goals` as the canonical goal record and explicit lifecycle/review state.

- [ ] Write failing SQL contract tests for allowed states, player ownership, leader review, and retained replaced goals.
- [ ] Run the targeted tests and confirm RED.
- [ ] Implement the minimal migration/RPC changes with authorization checks.
- [ ] Run targeted tests and confirm GREEN.
- [ ] Commit.

### Task 2: Build one player HUVUDMÅL surface

**Files:**
- Create or modify a focused main-goal frontend module; prefer `player-main-goal.js` if separating ownership from the oversized existing files.
- Modify: `index.html` asset loading/order/version.
- Modify: relevant development CSS, keeping mobile-first layout.
- Test: focused player main-goal rendering/state test.

**Interfaces:**
- Consumes the Task 1 RPC/state contract.
- Produces one `HUVUDMÅL` player card/editor with status presentation.

- [ ] Write failing tests for UTKAST, VÄNTAR PÅ TRÄNARE, GODKÄNT and for absence of duplicate goal/profile UI.
- [ ] Run targeted tests and confirm RED.
- [ ] Implement the minimal player UI and save/submit actions.
- [ ] Remove/disable the competing player-side Utvecklingsprofil and approved-leader-goal presentation while preserving leader functionality needed elsewhere.
- [ ] Bump changed Safari asset versions.
- [ ] Run targeted tests and confirm GREEN.
- [ ] Commit.

### Task 3: Adapt coach review to player-owned submissions

**Files:**
- Modify the existing coach development worklist/player page modules only where needed.
- Test: focused coach approval/return rendering and permissions tests.

**Interfaces:**
- Consumes submitted player main goals from Task 1.
- Produces coach actions: approve or return with comment.

- [ ] Write failing tests for coach review actions and player ownership preservation.
- [ ] Run targeted tests and confirm RED.
- [ ] Implement review UI/actions against the shared goal workflow.
- [ ] Run targeted tests and confirm GREEN.
- [ ] Commit.

### Task 4: Regression and integration gate

**Files:**
- Modify: `.github/workflows/home-news-tests.yml` if any new test file is not already explicitly run.
- Modify: `tests/critical-flow-contract.test.js` for new asset ownership/order where appropriate.

- [ ] Add regression coverage ensuring only one player HUVUDMÅL owner is mounted.
- [ ] Run syntax checks and all development tests locally/through available execution path.
- [ ] Open PR.
- [ ] Wait for a fresh GitHub Actions run on the final PR head.
- [ ] Inspect failures rather than merging around them.
- [ ] Merge only after the final head is green.
- [ ] Ask the user to verify HUVUDMÅL on iPhone before starting FOKUS.
