# Spelartrupp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg ett säkert, mobilanpassat spelarregister för Kronängs IF Juniorlag som ledare kan administrera direkt i appen och som blir primär källa för spelarens tröjnummer.

**Architecture:** En ny Supabase-tabell `players` lagrar den minimala spelaridentiteten. En separat JS-modul ansvarar för normalisering, validering, läsning och ledar-CRUD i Lag-vyn. Hem-sidan slår upp spelarens tröjnummer via `players.profile_id` med befintlig profilkolumn som fallback under övergången.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Supabase JS-klient, PostgreSQL/RLS, Node `assert`-tester, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-03-player-roster-management-design.md`

## Global Constraints

- Alla importerade spelare tillhör Kronängs IF Juniorlag; ingen lag-/gruppkolumn ska byggas.
- Endast namn, spelarens mobilnummer och födelsedatum får importeras från Excel.
- Personnummer, adresser, vårdnadshavare, e-post och allergier får inte sparas i spelarregistret eller seed-filen.
- Mobilnummer och födelsedatum är ledarinformation och ska inte visas för andra spelare.
- `Ta bort från truppen` ska sätta `is_active=false`, inte radera raden.
- `players.shirt_number` är primär källa för tröjnummer; `profiles.player_number` är endast fallback under övergången.
- Live-Supabase kan inte migreras från denna konversation; SQL-filer skapas och verifieras i GitHub.

---

### Task 1: Databasmodell, RLS och säker startimport

**Files:**
- Create: `supabase/migrations/202609030004_create_players.sql`
- Create: `supabase/migrations/202609030005_players_rls.sql`
- Create: `supabase/migrations/202609030006_seed_players.sql`
- Create: `tests/player-seed-privacy.test.js`

**Interfaces:**
- Produces: tabellen `public.players(id, full_name, mobile_phone, birth_date, shirt_number, is_active, profile_id, created_at, updated_at)`.
- Produces: seed som endast skriver `full_name`, `mobile_phone`, `birth_date`.

- [ ] **Step 1: Write the failing privacy test**

```js
const assert = require('assert');
const fs = require('fs');
const seed = fs.readFileSync('supabase/migrations/202609030006_seed_players.sql','utf8');
assert.ok(seed.includes('insert into public.players'));
['personnummer','adress','målsman','allergi','@'].forEach(term => {
  assert.ok(!seed.toLowerCase().includes(term), 'seed must not contain '+term);
});
console.log('player seed privacy tests passed');
```

- [ ] **Step 2: Run test and verify RED**

Run: `node tests/player-seed-privacy.test.js`
Expected: FAIL because seed file does not exist.

- [ ] **Step 3: Add schema and RLS**

Create `202609030004_create_players.sql` with the columns from the spec, `shirt_number` check `(shirt_number is null or shirt_number between 1 and 99)`, unique partial index on non-null `profile_id`, and updated timestamp trigger if the project already exposes one; otherwise omit trigger and update timestamp explicitly in CRUD.

Create `202609030005_players_rls.sql` with RLS enabled. Policies must allow authenticated coach/admin profiles to select/insert/update all `players`; player accounts may select only their own row where `profile_id=auth.uid()`. Do not grant player-wide reads.

- [ ] **Step 4: Build deduplicated seed from the two uploaded Excel files**

Read only rows with `Gruppkoppling = Spelare`. Derive `birth_date` from the first eight digits of Personnummer in memory, then discard Personnummer. Deduplicate using normalized full name plus birth date. Emit SQL only with:

```sql
insert into public.players (full_name, mobile_phone, birth_date)
values ('Exempel Spelare', '0701234567', '2011-01-02')
...
on conflict do nothing;
```

- [ ] **Step 5: Run privacy test and inspect seed**

Run: `node tests/player-seed-privacy.test.js`
Expected: PASS.

Run additionally: `grep -Ei 'personnummer|adress|målsman|allergi|@' supabase/migrations/202609030006_seed_players.sql`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/202609030004_create_players.sql supabase/migrations/202609030005_players_rls.sql supabase/migrations/202609030006_seed_players.sql tests/player-seed-privacy.test.js
git commit -m "feat: add secure junior player registry"
```

### Task 2: Pure player helpers and validation

**Files:**
- Create: `player-roster.js`
- Create: `tests/player-roster.test.js`

**Interfaces:**
- Produces: `normalizePlayer(row) -> {id,name,mobile,birthDate,shirtNumber,isActive,profileId}`.
- Produces: `validatePlayerInput(input) -> {ok:boolean, errors:string[], value:object}`.
- Produces: `formatSwedishBirthDate(isoDate) -> string`.
- Produces: `canManageRoster(role) -> boolean`.

- [ ] **Step 1: Write failing helper tests**

Test that coach/admin can manage, player cannot; blank names fail; shirt number `0` and `100` fail; empty shirt number is allowed; `2011-07-15` formats to `15 juli 2011`; mobile number is trimmed without destructive normalization.

- [ ] **Step 2: Run test and verify RED**

Run: `node tests/player-roster.test.js`
Expected: FAIL because module/functions do not exist.

- [ ] **Step 3: Implement minimal pure helpers**

Implement only the exported pure functions above. Keep DOM/Supabase code separate below those functions so Node tests can import safely.

- [ ] **Step 4: Run test and verify GREEN**

Run: `node tests/player-roster.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add player-roster.js tests/player-roster.test.js
git commit -m "feat: add player roster validation helpers"
```

### Task 3: Ledarens Spelartrupp-vy och CRUD

**Files:**
- Modify: `player-roster.js`
- Create: `player-roster.css`
- Modify: `index.html`
- Create: `tests/player-roster-ui.test.js`

**Interfaces:**
- Consumes: `canManageRoster`, `normalizePlayer`, `validatePlayerInput`, `formatSwedishBirthDate`.
- Produces: `buildRosterCardModel(row)` for deterministic UI testing.
- Produces browser flow: load active/inactive players; add/edit; soft deactivate/reactivate.

- [ ] **Step 1: Write failing UI-model tests**

Test that active player cards expose `Ta bort från truppen`, inactive cards expose `Återaktivera`, missing phone/birth date do not create undefined text, and shirt number renders `#17` only when present.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/player-roster-ui.test.js`
Expected: FAIL until `buildRosterCardModel` exists.

- [ ] **Step 3: Add Lag → Spelartrupp UI**

Append a section to `#teamPage` only for coach/admin after reading the signed-in profile role. Render an `+ Lägg till spelare` button, active player list, collapsible/secondary inactive list and a compact editor form containing name, mobile, birth date and shirt number.

- [ ] **Step 4: Implement Supabase CRUD**

Use:

```js
window.kronangSupabase.from('players').select('id,full_name,mobile_phone,birth_date,shirt_number,is_active,profile_id').order('full_name');
```

Insert/update only validated fields. Deactivate with `.update({is_active:false,updated_at:new Date().toISOString()})`; reactivate similarly. Never call `.delete()` for a player.

- [ ] **Step 5: Add responsive CSS and cache-busted includes**

Load `player-roster.css?v=1` and `player-roster.js?v=1` in `index.html`. Buttons must remain at least 44px high and no horizontal page overflow at 320px.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `node tests/player-roster.test.js && node tests/player-roster-ui.test.js`
Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add player-roster.js player-roster.css index.html tests/player-roster-ui.test.js
git commit -m "feat: add coach player roster management"
```

### Task 4: Koppla hem-sidans tröjnummer till spelarregistret

**Files:**
- Modify: `home-player-header.js`
- Modify: `tests/home-player-header.test.js`
- Create: `tests/player-shirt-number-source.test.js`

**Interfaces:**
- Produces: `choosePlayerNumber(rosterRow, profileRow) -> number|string` where roster value wins and profile is fallback.

- [ ] **Step 1: Write failing source-priority test**

```js
assert.strictEqual(choosePlayerNumber({shirt_number:17},{player_number:9}),17);
assert.strictEqual(choosePlayerNumber(null,{player_number:9}),9);
assert.strictEqual(choosePlayerNumber({shirt_number:null},{player_number:9}),9);
```

Also verify coach/admin still produce `roleLabel='Ledare'` and no player number.

- [ ] **Step 2: Run and verify RED**

Run: `node tests/player-shirt-number-source.test.js`
Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement roster lookup**

After profile base load, query `players` by `.eq('profile_id',user.id).eq('is_active',true).maybeSingle()`. Read `shirt_number`. If table/query fails or value is null, retain existing independent `profiles.player_number` fallback. Avatar loading remains independent.

- [ ] **Step 4: Run relevant tests**

Run: `node tests/home-player-header.test.js && node tests/player-shirt-number-source.test.js && node tests/profile-data-fallback.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add home-player-header.js tests/home-player-header.test.js tests/player-shirt-number-source.test.js
git commit -m "feat: source player number from roster"
```

### Task 5: CI, regression verification and handoff

**Files:**
- Modify: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- Consumes all new Node tests.
- Produces a green PR-ready branch.

- [ ] **Step 1: Add new tests to workflow**

Add commands for:

```bash
node tests/player-seed-privacy.test.js
node tests/player-roster.test.js
node tests/player-roster-ui.test.js
node tests/player-shirt-number-source.test.js
```

- [ ] **Step 2: Run full local Node suite**

Run every `tests/*.test.js` file used by the workflow before opening a PR. No intentional RED run may be pushed to a PR branch after the PR exists.

- [ ] **Step 3: Inspect diff for sensitive-data leakage**

Run repository grep across changed SQL/JS/docs for raw personal-number patterns and banned Excel fields. Ensure the seed contains only approved values.

- [ ] **Step 4: Open PR only after local GREEN**

Create PR from `codex/player-roster-management` to `main` with a summary that explicitly states live Supabase migrations still need to be applied separately.

- [ ] **Step 5: Verify GitHub Actions**

Wait for the PR workflow to complete and require `conclusion: success` before recommending merge.

- [ ] **Step 6: Finish branch**

Use `superpowers:finishing-a-development-branch` and present the supported completion options.