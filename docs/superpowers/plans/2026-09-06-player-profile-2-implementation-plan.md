# Spelarprofil 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg en mobil, sammanhållen ledarprofil för varje spelare med identitet, aktuellt utvecklingsläge, ledarverktyg, återkoppling och historik.

**Architecture:** Förbättra befintlig coach-player-vy och återanvänd `coach-player-context`, `coach-focus-feedback`, mål- och historikkomponenter. Lägg ingen parallell datamodell; profilhuvudet och snabblänkarna fungerar som ett presentations-/navigationslager över befintliga funktioner.

**Tech Stack:** HTML/CSS, vanilla JavaScript, Supabase, Node-baserade regressionstester, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-player-profile-2-design.md`

## Global Constraints
- Mobil först.
- Behåll befintliga Supabase/RLS- och rollregler.
- Duplicera inte utvecklingsdata eller skrivflöden.
- Svart/vit Kronäng-stil med sparsamma gulddetaljer.

---

### Task 1: Profilhuvud och informationsmodell
**Files:**
- Modify: `coach-player-page.js`
- Modify: `coach-player-page.css`
- Test: befintliga coach-player-tester eller nytt fokuserat test

- [ ] Skriv failing test för profilmodell med namn, nummer, position och rollmarkeringar.
- [ ] Kör test och verifiera RED.
- [ ] Utöka profilhuvudet med data från vald roster-knapp/profil utan nya databastabeller.
- [ ] Lägg mobil styling och tomlägesfallbacks.
- [ ] Kör test och verifiera GREEN.

### Task 2: Utveckling just nu och ledarverktyg
**Files:**
- Modify: `coach-player-page.js`
- Modify: `coach-player-context.js` vid behov
- Modify: `coach-player-page.css`
- Test: coach-player/context regressionstest

- [ ] Skriv failing test för sektionernas ordning och ledarverktygens mål.
- [ ] Kör och verifiera RED.
- [ ] Presentera befintligt mål/fokus under `UTVECKLING JUST NU`.
- [ ] Lägg `LEDARVERKTYG` med knappar som scrollar till/aktiverar befintliga fokus-, feedback- och målflöden.
- [ ] Kör och verifiera GREEN.

### Task 3: Återkoppling, historik och mobil polish
**Files:**
- Modify: `coach-player-page.css`
- Modify: `coach-history.js` eller `coach-focus-feedback.js` endast om rubrik/ankare krävs
- Modify: `index.html` för cacheversioner
- Test: relevanta befintliga workflow-tester

- [ ] Skriv failing regressionstest för rubriker/ankare/cacheversion.
- [ ] Kör och verifiera RED.
- [ ] Gör senaste återkoppling tydlig och historiken visuellt sekundär längre ned.
- [ ] Bumpa ändrade asset-versioner.
- [ ] Kör hela testsuiten och verifiera GREEN.

### Task 4: Integrationsverifiering
- [ ] Kör hela GitHub Actions på PR-head.
- [ ] Kontrollera att coach-, development-, role-, roster- och security-tester är gröna.
- [ ] Granska diffen för att säkerställa att ingen ny behörighet eller parallell lagring införts.
- [ ] Merge först efter färsk grön CI.