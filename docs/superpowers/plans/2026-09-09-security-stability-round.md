# Security & Stability Round Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden roster privacy, invitation-only onboarding, team-post image privacy, and SportAdmin sync authentication without changing the intended player/coach/admin experience.

**Architecture:** Keep leader workflows on the existing `players` table, expose a security-definer public-roster RPC with only non-sensitive fields to players/parents, and enforce invitation eligibility in the database trigger. Make team-post storage private and resolve image object paths to signed URLs client-side. Remove the publishable-key sync bypass and require either an authenticated active admin or a dedicated server-to-server secret supplied from GitHub Actions.

**Tech Stack:** Vanilla JavaScript, Supabase Auth/Postgres/RLS/Storage/Edge Functions, GitHub Actions, Node test runner.

**Spec:** User-approved security review points 1–4 from 2026-09-09.

## Global Constraints
- Player/parent roster views must not expose mobile number or birth date.
- Leaders/admin retain current roster editing access.
- A new auth user must correspond to a pending invitation before profile bootstrap succeeds.
- Team-post images must not be publicly readable without authentication.
- SportAdmin sync must not use the public Supabase publishable key as a shared secret.

---

### Task 1: Roster privacy
**Files:** create migration, modify `player-roster.js`, add security regression test.
- [ ] Add failing test asserting public roster RPC omits sensitive fields and non-leaders use it.
- [ ] Verify red in CI.
- [ ] Add `list_public_roster_players()` security-definer RPC and remove broad active-member `players` select policy.
- [ ] Switch player/parent roster loading to the RPC; leaders keep full table query.
- [ ] Verify green.

### Task 2: Server-enforced invite-only onboarding
**Files:** create migration, modify `supabase/functions/invite-user/index.ts`, add regression test.
- [ ] Add failing test asserting profile bootstrap requires invitation and invitation metadata is created before Auth invite.
- [ ] Verify red.
- [ ] Harden `handle_new_kronang_user()` to reject uninvited emails and mark matching invitation accepted.
- [ ] Reorder invite-user function to write invitation first and clean it up if Auth invite fails.
- [ ] Verify green.

### Task 3: Private team-post images
**Files:** create migration, modify `team-posts.js`, add regression test.
- [ ] Add failing test asserting bucket is private, active users get select policy, and client uses signed URLs.
- [ ] Verify red.
- [ ] Make bucket private and add authenticated active-user read policy.
- [ ] Store object paths for new uploads and resolve both legacy public URLs and paths to signed URLs for display.
- [ ] Verify green.

### Task 4: SportAdmin sync authentication
**Files:** modify Edge Function and GitHub workflow, add regression test.
- [ ] Add failing test rejecting publishable-key shared-secret auth and requiring `SPORTADMIN_SYNC_KEY`/GitHub secret wiring.
- [ ] Verify red.
- [ ] Accept active-admin JWT or dedicated `SPORTADMIN_SYNC_KEY` only.
- [ ] Make scheduled workflow read `${{ secrets.KRONANG_SPORTADMIN_SYNC_KEY }}` and fail clearly when absent.
- [ ] Verify green and full CI.
