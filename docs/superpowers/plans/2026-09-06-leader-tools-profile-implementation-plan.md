# Ledarverktyg på Profil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flytta samlade ledarverktyg och truppadministration från Laget till Profil, samtidigt som Laget behåller gemensamt laginnehåll och kontextuell redigering av inlägg.

**Architecture:** Återanvänd befintliga editorer och permissions men ändra deras host från `teamPage` till en rollstyrd panel under `profilePage`. Den publika spelartruppen och ledarstaben stannar på Laget. Truppens administrativa kontroller ska kunna flyttas/öppnas från Profil utan att skapa ett nytt administrationssystem.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Supabase, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-leader-tools-profile-design.md`

## Global Constraints
- Ingen ändring av databas-schema.
- Ingen ny behörighetsmodell.
- Återanvänd befintliga editorer och Supabase-anrop.
- Spelare/föräldrar ska inte se Ledarverktyg.
- Laget ska behålla laginlägg, veckans fokus, spelartrupp och ledarstab.
- Kontextuella `REDIGERA`/`TA BORT` på inlägg ska ligga kvar på Laget.

---

### Task 1: Definiera destinationsmodellen för ledarverktygen

**Files:**
- Modify: `team-posts.js`
- Test: `tests/team-posts.test.js`

**Interfaces:**
- Produces: en testbar modell/helper som anger `profilePage` som host för den samlade ledarpanelen.

- [ ] **Step 1: Write the failing test** som kräver att ledarpanelen hör till Profil och har fyra verktyg inklusive `HANTERA TRUPP`.
- [ ] **Step 2: Run test to verify it fails** med nuvarande `teamPage`-beteende.
- [ ] **Step 3: Write minimal implementation** för host/modell och panelplacering på `profilePage`.
- [ ] **Step 4: Run tests and verify green** för team-post tester.

### Task 2: Flytta fokus- och utmaningseditorer till Profilens ledarpanel

**Files:**
- Modify: `team-focus.js`
- Modify: `team-challenge.js`
- Modify: `team-posts.js`
- Test: `tests/team-posts.test.js`
- Test: `tests/team-challenge.test.js`

**Interfaces:**
- Consumes: `#teamLeaderToolsActions` på Profil.
- Produces: samma editor-DOM och befintliga fokuserade editorbeteende, men hostat under Profil.

- [ ] **Step 1: Extend failing tests** så att editorerna återanvänder Profilens actions-host.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Rehome existing managers** utan att ändra Supabase-anrop eller permissions.
- [ ] **Step 4: Verify focused editor tests and team challenge tests green**.

### Task 3: Flytta truppadministration till Profil men behåll publik trupp på Laget

**Files:**
- Modify: `player-roster.js`
- Test: `tests/player-roster-ui.test.js`

**Interfaces:**
- Consumes: Profilens `#teamLeaderToolsActions` eller en dedikerad trupp-admin-host i `#teamLeaderTools`.
- Produces: `HANTERA TRUPP` för admin/ledare som öppnar befintlig truppadministration; spelarlistan på Laget påverkas inte.

- [ ] **Step 1: Write failing regression test** som separerar public roster från manager controls.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Move/rehome manager controls and wire `HANTERA TRUPP`**.
- [ ] **Step 4: Verify player roster tests green**.

### Task 4: Mobil styling och cache-bust

**Files:**
- Modify: `team-posts.css`
- Modify: `player-roster.css` if needed
- Modify: `index.html`
- Test: existing UI/cache tests as applicable

**Interfaces:**
- Produces: tydlig Profil-sektion för ledare; Laget börjar med lagets innehåll.

- [ ] **Step 1: Add/adjust tests for asset versions or structural markers if needed**.
- [ ] **Step 2: Style profile leader tools mobile-first**.
- [ ] **Step 3: Bump relevant asset query versions in `index.html`**.
- [ ] **Step 4: Run full test suite**.

### Task 5: PR-verifiering

**Files:**
- Modify: `.github/workflows/home-news-tests.yml` only if a new test file needs explicit inclusion.

- [ ] **Step 1: Open PR against `main`**.
- [ ] **Step 2: Confirm fresh GitHub Actions run completes green**.
- [ ] **Step 3: Review changed files against spec**: Laget clean, Profil leader tools, public roster retained, contextual post edit retained, no permission/database changes.
- [ ] **Step 4: Merge only after fresh CI green**.
