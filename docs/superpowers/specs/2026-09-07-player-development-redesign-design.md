# Player Development Redesign Design

## Goal
Rebuild the player-facing Utveckling page as one coherent development journey, delivered incrementally without destabilizing Home, Calendar, Laget, Profile, or the working Calendar bridge.

## Player journey
The page order is:
1. HUVUDMÅL
2. FOKUS
3. SJÄLVSKATTNING
4. UTVECKLING ÖVER TID
5. HISTORIK

The mental model is: Vart ska jag? → Vad arbetar jag med nu? → Hur tycker jag att det går? → Hur har jag utvecklats? → Vad har jag gjort tidigare?

## HUVUDMÅL
HUVUDMÅL replaces the current duplicate presentation of Utvecklingsprofil and the separate approved-leader-goal treatment.

The player owns the goal. The player creates or edits the proposed main goal and submits it for coach review. The goal has an explicit approval state presented as UTKAST, VÄNTAR PÅ TRÄNARE, or GODKÄNT. A coach can approve the player's proposal or return it with a comment. The coach does not replace ownership of the goal.

An approved goal becomes the active main goal. When a later main goal replaces it, the old goal is retained for Målhistorik rather than overwritten.

Existing goal details such as description, success description, subgoals, completion, and final reflection should be preserved where they still serve the main-goal model. Existing leader-proposal UI must not remain as a second competing goal system on the player page.

## FOKUS
The coach owns the player's current focus. It is concrete, shorter-term guidance toward the player's main goal. The player reads the current focus and can reflect on how it is going. Previous focus periods are retained for Fokushistorik.

## SJÄLVSKATTNING
Keep the four existing areas: Teknik, Spelförståelse, Fys, Mentalitet. The player rates each area 1–5 and writes a short reflection. The coach records a separate assessment/comment. Player and coach values are displayed together when both exist.

Every saved assessment is a dated snapshot. New assessments must not overwrite previous snapshots.

## UTVECKLING ÖVER TID
Use saved dated assessment snapshots to show real development over time. Each of the four areas can show the player's self-rating and the coach's rating as distinct series. The purpose is to answer quickly: "Blir jag bättre?"

## HISTORIK
Use one HISTORIK entry point instead of three large permanent blocks. It contains:
- Målhistorik: previous main goals, approval/completion context, dates, coach comments, final reflections where available.
- Fokushistorik: previous coach-set focus periods and player reflections.
- Utvecklingshistorik: dated assessment snapshots with Teknik, Spelförståelse, Fys, Mentalitet and coach feedback.

## Delivery strategy
Implement in independently testable stages. Stage 1 is HUVUDMÅL only. After it is green in CI and verified on the user's iPhone, proceed to FOKUS, then SJÄLVSKATTNING, UTVECKLING ÖVER TID, and finally HISTORIK.

Do not refactor unrelated app navigation or the Calendar bridge. Preserve role/access behavior. Use branch → PR → TDD/regression tests → fresh green GitHub Actions → merge.

## Stage 1 success criteria
- Player sees one HUVUDMÅL surface, not duplicate goal/profile surfaces.
- Player can compose a main goal and submit it for coach approval.
- UI distinguishes UTKAST, VÄNTAR PÅ TRÄNARE, and GODKÄNT.
- Coach can approve or return/comment on a submitted player goal.
- Approved goal remains player-owned and becomes active.
- Replaced goals remain available for later history work.
- Existing useful goal details are migrated/reused rather than silently discarded.
- Safari receives versioned assets for changed frontend files.
- Automated tests cover state transitions, permissions, rendering ownership, and no duplicate player goal surface.
