# Mobile Polish and Team Staff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Förbättra mobil-Hem, separera Lagets veckofokus visuellt, synka profilbilden mellan Hem och Profil och lägga till en datadriven ledarstab med kontaktuppgifter.

**Architecture:** Behåll befintlig sidstruktur och navigering. Lägg mobiljusteringar i befintlig startsides-CSS, låt `team-focus.js` fortsätta skapa fokus-kortet men styla dess etablerade klass, skapa ett fristående `team-staff.js`/`team-staff.css` för ledarstaben och ett litet `profile-avatar.js` för profilbildssynk. Ledarkontakter lagras i Supabase-tabellen `team_staff` och UI:t ska degradera säkert om tabellen ännu inte finns.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Supabase JS v2, Node assert-baserade tester, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-03-mobile-polish-team-staff-design.md`

## Global Constraints
- Kalender och Utveckling ska inte ändras i detta arbete.
- Mobil-Hem ska inte skapa horisontell overflow.
- `team_staff` får inte innehålla hårdkodade privata kontaktuppgifter i GitHub.
- Profilbilden ska använda `profiles.avatar_url` med neutral fallback.
- Alla nya databasberoenden ska ha UI-fallback om migrationen inte är körd.
- Befintliga Hem/nyhets-tester ska fortsätta passera.

---

### Task 1: Mobil-Hem utan förskjutning och med kompaktare kort

**Files:**
- Modify: `home-player-header.css`
- Test: `tests/home-mobile-layout.test.js`

**Interfaces:**
- Consumes: befintliga klasser `.home-dashboard`, `.home-intro`, `.home-player-avatar`, `.home-next-activity`, `.home-challenge-card`, `.home-news-card`.
- Produces: mobilregler som begränsar pseudo-element till viewporten och minskar vertikal padding.

- [ ] **Step 1: Write the failing test**

```js
const fs = require('fs');
const assert = require('assert');
const css = fs.readFileSync('home-player-header.css', 'utf8');
assert.ok(css.includes('overflow-x:hidden') || css.includes('overflow-x:clip'));
assert.ok(css.includes('@media(max-width:560px)'));
assert.ok(css.includes('.home-dashboard::before'));
assert.ok(css.includes('inset-inline'));
console.log('home mobile layout tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/home-mobile-layout.test.js`
Expected: FAIL because current CSS does not yet contain viewport-clipping rules using `inset-inline`.

- [ ] **Step 3: Write minimal implementation**

Update mobile CSS so `.home-dashboard` clips horizontal decorative overflow, the watermark pseudo-element is bounded by the home section instead of painting a half-screen block, and mobile card padding is reduced by roughly 15–20% while retaining the current large profile circle.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/home-mobile-layout.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add home-player-header.css tests/home-mobile-layout.test.js
git commit -m "fix: polish mobile home layout"
```

### Task 2: Tydligt mörkt Veckans fokus på Laget

**Files:**
- Modify: `team-posts.css`
- Test: `tests/team-focus-style.test.js`

**Interfaces:**
- Consumes: `team-focus.js` skapar `#teamWeeklyFocus.card.team-weekly-focus`.
- Produces: visuell hierarki där fokus är mörkt och nyhetskort är vita.

- [ ] **Step 1: Write the failing test**

```js
const fs = require('fs');
const assert = require('assert');
const css = fs.readFileSync('team-posts.css', 'utf8');
assert.ok(css.includes('.team-weekly-focus'));
assert.ok(css.includes('background:linear-gradient'));
assert.ok(css.includes('color:#fff'));
console.log('team focus style tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/team-focus-style.test.js`
Expected: FAIL until the dedicated dark style exists.

- [ ] **Step 3: Write minimal implementation**

Add a dedicated `.team-weekly-focus` treatment with dark gradient, white typography, gold accent and a subtle tactical pseudo-element. Do not change `.team-post` styling.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/team-focus-style.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add team-posts.css tests/team-focus-style.test.js
git commit -m "style: distinguish team weekly focus"
```

### Task 3: Datamodell och render-model för Ledarstaben

**Files:**
- Create: `team-staff.js`
- Create: `team-staff.css`
- Create: `tests/team-staff.test.js`
- Create: `supabase/team_staff.sql`
- Modify: `index.html`

**Interfaces:**
- Produces: `buildTeamStaffMember(row)` returning `{name, role, phone, email, avatarUrl, phoneHref, emailHref}`.
- Produces: `renderTeamStaff(profile)` which loads active rows matching `profile.team` and inserts `#teamStaffSection` into `#teamPage`.

- [ ] **Step 1: Write the failing test**

```js
const assert = require('assert');
const { buildTeamStaffMember } = require('../team-staff.js');
const coach = buildTeamStaffMember({display_name:'Anna', staff_role:'Huvudtränare', phone:'0701234567', email:'anna@example.se', avatar_url:'https://example.se/a.jpg'});
assert.strictEqual(coach.name, 'Anna');
assert.strictEqual(coach.role, 'Huvudtränare');
assert.strictEqual(coach.phoneHref, 'tel:0701234567');
assert.strictEqual(coach.emailHref, 'mailto:anna@example.se');
const noContact = buildTeamStaffMember({display_name:'Bo', staff_role:'Lagledare'});
assert.strictEqual(noContact.phoneHref, '');
assert.strictEqual(noContact.emailHref, '');
console.log('team staff tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/team-staff.test.js`
Expected: FAIL because `team-staff.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `buildTeamStaffMember(row)` and DOM rendering. Query:

```js
window.kronangSupabase
  .from('team_staff')
  .select('display_name, staff_role, phone, email, avatar_url, sort_order')
  .eq('team', profile.team)
  .eq('is_active', true)
  .order('sort_order', { ascending: true })
  .order('display_name', { ascending: true });
```

If the query errors, render a compact fallback text `Kontaktuppgifter till ledarstaben är inte publicerade ännu.` and do not throw.

Create `supabase/team_staff.sql` with the columns in the spec and RLS that permits authenticated reads only when `team_staff.team` equals the current user's `profiles.team`. No real names, phone numbers or emails are inserted by the migration.

Wire `team-staff.css` and `team-staff.js` into `index.html` after existing team assets.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/team-staff.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add team-staff.js team-staff.css tests/team-staff.test.js supabase/team_staff.sql index.html
git commit -m "feat: add team staff contacts"
```

### Task 4: Synka profilbild mellan Hem och Profil

**Files:**
- Create: `profile-avatar.js`
- Create: `tests/profile-avatar.test.js`
- Modify: `index.html`
- Modify: `style.css`

**Interfaces:**
- Produces: `buildProfileAvatarModel(profile)` returning `{name, avatarUrl}`.
- DOM target: `#profilePage .profile-avatar`.

- [ ] **Step 1: Write the failing test**

```js
const assert = require('assert');
const { buildProfileAvatarModel } = require('../profile-avatar.js');
assert.deepStrictEqual(buildProfileAvatarModel({full_name:'Testspelare', avatar_url:'https://example.se/me.jpg'}), {name:'Testspelare', avatarUrl:'https://example.se/me.jpg'});
assert.deepStrictEqual(buildProfileAvatarModel({full_name:'Testspelare'}), {name:'Testspelare', avatarUrl:''});
console.log('profile avatar tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/profile-avatar.test.js`
Expected: FAIL because `profile-avatar.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Load `full_name, avatar_url` for the signed-in user. If `avatar_url` exists, replace the emoji content in `.profile-avatar` with an `<img>` using `object-fit:cover`; otherwise render the same neutral line-icon fallback used by Home. Add CSS so the round crop remains stable on mobile.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/profile-avatar.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add profile-avatar.js tests/profile-avatar.test.js index.html style.css
git commit -m "feat: sync profile avatar"
```

### Task 5: CI och regression

**Files:**
- Modify: `.github/workflows/home-news-tests.yml`

**Interfaces:**
- Consumes: all tests from Tasks 1–4 plus existing home/news tests.
- Produces: one CI gate covering mobile polish, staff model and avatar sync.

- [ ] **Step 1: Update workflow commands**

Run these Node tests in the workflow:

```bash
node tests/home-player-header.test.js
node tests/team-posts.test.js
node tests/home-mobile-layout.test.js
node tests/team-focus-style.test.js
node tests/team-staff.test.js
node tests/profile-avatar.test.js
```

- [ ] **Step 2: Run all tests locally or through branch CI**

Expected: every command exits 0.

- [ ] **Step 3: Check JavaScript syntax**

```bash
node --check team-staff.js
node --check profile-avatar.js
node --check home-player-header.js
```

Expected: no output and exit 0.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/home-news-tests.yml
git commit -m "ci: cover mobile staff and profile polish"
```

- [ ] **Step 5: Open PR and merge only after CI success**

PR summary must explicitly state that Kalender and Utveckling are intentionally unchanged and that the `team_staff` migration must be applied in Supabase before real staff contacts appear.
