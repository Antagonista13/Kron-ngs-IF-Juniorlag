# Design: Split main app CI tests

Date: 2026-09-10

## Goal
Replace the oversized `Home and news tests` workflow with smaller, clearly named pull-request checks so a failure immediately identifies the affected app area. The split must preserve current coverage and must not change application runtime code.

## Current problem
`.github/workflows/home-news-tests.yml` currently runs syntax checks plus roughly 50 separate test steps spanning Home, News, Team, roster, profiles, development, calendar, admin, permissions, onboarding and security. A failure anywhere marks the single workflow `Home and news tests` red, which makes failures appear related to Home/News even when another area such as Admin is the real cause.

## Proposed workflow groups

### 1. Critical app checks
Fast, cross-cutting checks that should fail early:
- Syntax checks for browser/runtime JavaScript
- `tests/ci-stability-coverage.test.js`
- `tests/critical-flow-contract.test.js`
- Browser script compatibility
- Navigation scroll/reset tests

### 2. Home and News
Only Home/news-facing coverage:
- Home tests
- Mobile home tests
- Header polish
- Team posts
- News 2.0 SQL/editor permissions

### 3. Team and Roster
Team presentation and roster management:
- Team focus style
- Team staff + Team staff 2.0
- Team player name size
- Player roster
- Player nickname
- Player public profile
- Player roster UI/open-profile
- Player shirt number source
- Player seed privacy

### 4. Player and Profile
Player-facing profile and development functionality:
- Profile avatar
- Profile role / leader about me
- Player profile redesign
- Profile image 2.0
- Profile data fallback
- Development role/assets/icons
- Player development workflow
- Player focus edit
- Player main goal SQL/UI
- Team challenge

### 5. Coach and Leader
Coach/leader development surfaces:
- Leader development compact
- Coach main goal review
- Coach player profile 2

### 6. Calendar
Calendar-only coverage:
- Calendar 2.0 tests

### 7. Admin and Access
Admin, authentication, invitations and permissions:
- Auth tests
- Admin role schema
- Admin user RPCs
- Admin save timestamp SQL
- Admincenter
- Admin cleanup round
- Reinvite/invite role labels
- Permission SQL
- Access gate
- Role content visibility
- Admin view
- Admin approval
- Invite function

### 8. Security checks
Static leak/privacy checks currently at the end of the combined workflow.

Existing dedicated workflows remain separate:
- Player phone privacy tests
- SportAdmin roster sync tests
- SportAdmin daily sync (scheduled workflow)

## Implementation approach
Create separate YAML workflows under `.github/workflows/` for the groups above. Each pull-request workflow uses the same checkout/setup-node baseline and runs only its assigned tests. Delete the old `home-news-tests.yml` after every current step has been mapped exactly once (except deliberate cross-cutting duplication such as syntax/critical checks if required).

## Safety constraints
- No application code changes.
- No test files removed or weakened.
- Preserve all existing test commands and Node 22.
- Every test currently in `home-news-tests.yml` must remain covered.
- Security leak checks stay blocking.
- Existing SportAdmin and phone privacy workflows remain untouched.

## Verification
Before the split is considered complete:
1. Compare old workflow steps against the new workflow commands and confirm full coverage.
2. Validate YAML syntax and workflow files.
3. Open a PR and require all new workflow runs to complete.
4. Confirm failures are isolated to their named domain rather than collapsing into one umbrella status.

## Expected result
A PR will show several precise checks such as `Critical app checks`, `Home and News`, `Team and Roster`, `Player and Profile`, `Coach and Leader`, `Calendar`, `Admin and Access`, `Security checks`, plus the existing SportAdmin and phone privacy workflows. This makes regressions easier to locate and reduces ambiguity without reducing coverage.