# Leader Message Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notify each opted-in leader of new player messages with independent read state.
**Architecture:** Extend existing opt-in RPCs and notification fan-out; keep existing per-profile receipts. Reuse generic worker and device subscription ownership. An independent leader rollout switch preserves the player pilot.
**Tech Stack:** PostgreSQL/Supabase, browser JavaScript, Node/PGlite/JSDOM.
**Spec:** `docs/superpowers/specs/2026-10-07-leader-message-push.md`

## Global Constraints
- Active admin/coach, same team, opt-in; leader message category only.
- A read receipt clears only its reader's notification.
- Replies from staff do not notify other staff.
- No general player rollout change and no private push content.

## Review Focus
- Two leaders reading at different times keep independent counts.
- Team/role/roster changes cancel pending delivery.
- Opt-in timestamp avoids old-message backlog.
- Notification click after login opens correct player conversation.
- Device owner and unsupported roles remain restricted.

### Task 1: Database recipients and read isolation
**Files:** New CLI-generated migration; `supabase/tests/leader_web_push.sql`, `push-local.mjs`, `web_push.sql`.
**Interfaces:** Existing register/preferences/status/test/delivery RPCs; new internal active-recipient and delivery-enabled predicates.
- [ ] Add SQL tests for two leaders, admin, other-team, opted-out/inactive accounts; independent reads and reply routing; revalidation and category limits.
- [ ] Run `npm run test:push --prefix supabase/tests` and observe expected role/fan-out failure.
- [ ] Extend functions additively and keep helper execution service-only.
- [ ] Run PostgreSQL tests and verify no failures.

### Task 2: Leader activation and notification routing
**Files:** `push-notifications.js`, `index.html`, `supabase/tests/push-dom.mjs`, operations guide.
**Interfaces:** Existing status RPC and RLS-protected chat conversation/player selects.
- [ ] Test active coach/admin Profile controls, message-only defaults and real chat routing; deny parent and unavailable conversation.
- [ ] Run DOM suite and observe expected hidden/route failures.
- [ ] Enable leader controls and route to source conversation player after validation; bump asset version.
- [ ] Run all 468+ Node tests, DOM and SQL suites; independent review, fix findings.
- [ ] Create PR against current main. Apply migration before publication and activate leader switch only after merge and deployment, preserving player pilot. Report phone activation steps.
