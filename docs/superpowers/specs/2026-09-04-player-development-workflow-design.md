# Player Development Workflow Design

## Status
Approved in chat on 2026-09-04.

## Purpose
Turn the existing Kronängs IF junior app into a practical player-development tool for coaches and players. The first version shall connect coach overview, player development profiles, four-week follow-up, coach notes, goal proposals, and in-app unread notifications into one coherent workflow.

## Product principles
- Player development is the core use case.
- The player owns the active development goal.
- Coaches coach the goal: they may propose a new or revised goal, but the player must accept it before it becomes active.
- Coaches may write both player-visible notes and leader-only notes.
- Leader-only content must never be exposed to players or parents, including through direct database access.
- A follow-up counts only when a coach deliberately registers it with a comment.
- Every player should normally receive a development follow-up at least every four weeks.
- In-app unread indicators come first. Push notifications are explicitly out of scope for this version.

## Roles and access
The existing system roles remain the source of truth.

### Admin
- Same development permissions as Coach.
- May access all players' development profiles.
- May register follow-ups and notes.
- May propose goal changes.

### Coach
- May access all players' development profiles.
- May register follow-ups and notes.
- May propose goal changes.
- May read leader-only notes.

### Player
- May access only their own development profile.
- May read their own player-visible follow-ups and notes.
- May create or edit their own active development goal.
- May accept or reject coach goal proposals addressed to them.
- May read only notifications addressed to their own user account.
- Must not read leader-only notes.

### Parent
- No access to personal player-development content in version 1.
- No access to player development notifications.

All access rules must be enforced in Supabase RLS/RPCs, not only hidden in the browser UI.

## Coach player overview
The existing player area shall become a coach worklist rather than a simple roster when viewed by Admin or Coach.

Each player row/card should show, where available:
- player name,
- shirt number,
- active development goal,
- current focus,
- latest registered development follow-up,
- follow-up status.

### Filters
The first version provides four filters:
- `Alla`
- `Behöver följas upp`
- `Saknar mål`
- `Nyligen uppdaterade`

### Follow-up status
A player enters `Behöver följas upp` when 28 days have passed since the latest registered development follow-up.

Opening a player profile does not count as a follow-up and must not reset the 28-day interval.

For a player with no registered follow-up, the overview should treat the player as requiring follow-up once the product has enough context to do so; implementation must avoid inventing a false historical follow-up date.

### Recently updated
`Nyligen uppdaterade` should be derived from meaningful development activity, such as a new follow-up, goal change, goal proposal, or player-visible coach note. It should not be driven by unrelated profile edits.

## Player development profile
The development profile is the main workspace for one player.

It contains four primary sections:
1. Player identity and status.
2. `Mitt utvecklingsmål`.
3. `Aktuellt fokus`.
4. `Uppföljningar & anteckningar`.

For Admin/Coach, the page also exposes the actions:
- `REGISTRERA UPPFÖLJNING`
- `FÖRESLÅ ÄNDRING AV MÅL`

The coach view displays `Senast uppföljd` and whether the player currently `Behöver följas upp`.

## Development goals
The active development goal belongs to the player.

### Player behavior
- The player may create or update their own active goal.
- A player may have one active goal at a time in version 1.
- Previous goals should remain available as history rather than being overwritten destructively.

### Coach proposal behavior
A coach does not directly replace the active player goal. Instead, the coach creates a proposal containing:
- proposed goal text,
- optional coach explanation/comment,
- proposing coach,
- creation timestamp,
- status.

Proposal statuses are:
- `pending`
- `accepted`
- `rejected`

While pending, the player sees the current goal and the proposal together.

The player chooses either:
- `GODKÄNN`, which makes the proposed text the new active goal and records the old goal in history, or
- `BEHÅLL MITT MÅL`, which marks the proposal rejected and leaves the active goal unchanged.

A pending coach proposal must create an unread player notification.

## Follow-ups and notes
A registered development follow-up is a deliberate coach action and requires a non-empty comment.

Each follow-up/note records:
- player,
- author profile,
- created timestamp,
- comment text,
- visibility,
- type or purpose sufficient to distinguish a registered follow-up from an ordinary coach note.

### Visibility
Two values are supported:
- `player_visible`
- `leaders_only`

`player_visible` content may be read by the player it belongs to and by Admin/Coach.

`leaders_only` content may be read only by Admin/Coach. It must not be returned to Player or Parent through normal queries, RPCs, notifications, or direct table access.

### Follow-up requirement
Only a deliberately registered follow-up updates the player's latest follow-up date. An ordinary note does not automatically count as the four-week follow-up unless the coach explicitly registered it as such.

A player-visible registered follow-up creates an unread notification for that player. A leaders-only follow-up or note never creates a player notification.

## In-app unread notifications
Version 1 adds a small, reusable notification subsystem for personal in-app activity.

A notification belongs to one recipient profile and records at minimum:
- recipient,
- event type,
- reference to the related development entity or sufficient reference metadata,
- created timestamp,
- read timestamp or unread state.

### Notification-producing events in version 1
Create a player notification when:
- a coach creates a player-visible follow-up,
- a coach creates another player-visible development note that is intended to surface as new feedback,
- a coach creates a new goal proposal.

Do not create a player notification when:
- a note or follow-up is `leaders_only`,
- unrelated player or account data changes,
- a parent-facing event occurs.

### Red dot behavior
When the signed-in player has at least one unread personal development notification, show a red dot on the `Utveckling` destination in the bottom navigation.

Inside the development view, clearly mark which items are new. The first version uses a dot/`NYTT` treatment rather than a numeric unread badge.

Opening the development page alone must not automatically clear every notification. A notification is marked read when the player opens or meaningfully views the related item. The red dot remains until no unread development notifications remain.

### Future compatibility
The notification table/design should be generic enough to support future in-app event types, such as a personal challenge or other targeted team activity. Push delivery is not part of this implementation.

## Data model direction
The implementation should extend the current Supabase model with focused tables rather than overloading the existing player roster row.

Recommended logical entities:
- development goals / goal history,
- coach goal proposals,
- development entries for follow-ups and notes,
- personal notifications.

The implementation plan may choose exact table names and columns after inspecting the current migrations, but it must preserve the behavioral boundaries in this design.

Existing `players.profile_id` linkage should remain the bridge between a player roster record and the authenticated Player profile unless inspection reveals an already-established equivalent relationship.

## Data flow
### Coach follow-up
1. Admin/Coach opens the coach player overview.
2. The system shows players and derives follow-up status from registered follow-up activity.
3. Coach opens one player.
4. Coach selects `REGISTRERA UPPFÖLJNING`.
5. Coach enters a required comment and chooses visibility.
6. The database persists the follow-up and author/timestamp.
7. If player-visible, the database/application also creates an unread notification for the linked player profile.
8. The player overview now uses this follow-up as the latest registered follow-up.

### Coach goal proposal
1. Coach opens a player profile.
2. Coach selects `FÖRESLÅ ÄNDRING AV MÅL`.
3. Coach enters proposed goal text and optionally an explanation.
4. Proposal is stored as `pending`.
5. Player receives an unread development notification.
6. Player opens their development profile.
7. Player accepts or rejects.
8. On acceptance, the new goal becomes active and the previous goal remains in history.
9. On rejection, the active goal remains unchanged.

### Player reads new feedback
1. Player signs in.
2. The app discovers at least one unread development notification.
3. A red dot appears on `Utveckling` in bottom navigation.
4. Player opens the development view and sees which item is new.
5. Player opens/views the related item.
6. That notification becomes read.
7. The red dot disappears only when all development notifications are read.

## Error handling
- Saving a follow-up with an empty comment must be blocked client-side and rejected server-side/database-side.
- If a player has no linked auth profile, coaches may still retain development data against the roster player, but no player notification should be attempted until a recipient profile exists.
- If notification creation fails, the implementation must not silently pretend the player was notified. The plan should prefer a transactional or database-side mechanism where practical so the development write and notification creation remain consistent.
- If a goal proposal is accepted or rejected more than once, the backend must reject invalid state transitions.
- If an unauthorized role attempts to read or mutate development data, RLS/RPC authorization must deny the action.
- UI error states should be concise and actionable; failed saves must not clear the user's entered text.

## UI direction
Keep the existing mobile-first visual language of the app.

Coach overview:
- compact cards/rows,
- high information density without looking like an admin table,
- visible follow-up state,
- simple filter chips/tabs,
- clear tap target to open a player.

Player development profile:
- one clear hierarchy,
- active goal prominent,
- pending coach proposal visually distinct from the active goal,
- follow-up history chronological,
- `Endast ledare` visibly marked in coach view,
- new player-visible items marked `NYTT` until read.

Notification indicator:
- small red dot,
- no number in version 1,
- attached to `Utveckling` in bottom navigation for Player only.

## Out of scope for version 1
- Mobile/web push notifications.
- Parent access to personal development profiles.
- Parent-player linking for development data.
- Advanced statistics or analytics dashboards.
- Exercise-library recommendations based on a development goal.
- Automatic AI-generated coaching suggestions.
- Numeric unread badges.
- Reworking unrelated News, Calendar, or Administration behavior.

## Testing requirements
Implementation shall follow TDD and include automated coverage for:
- 28-day follow-up status calculation,
- overview filter behavior,
- mandatory follow-up comment validation,
- player-visible vs leaders-only visibility,
- goal proposal creation and state transitions,
- accepted proposal becoming the active player goal,
- rejected proposal preserving the current goal,
- notification creation only for player-visible events,
- unread/read state and red-dot derivation,
- role visibility in the UI,
- SQL/RLS security rules that prevent Player/Parent access to leaders-only data and other players' development data,
- cache/version references for newly introduced browser assets when relevant.

The full branch test suite must pass before a pull request is considered ready to merge.

## Success criteria
Version 1 is successful when:
- Henrik or Niklas can quickly identify who needs a development follow-up,
- a coach can register a required-comment follow-up and choose its visibility,
- player-visible feedback appears for the correct player and creates a red unread indicator,
- leaders-only notes remain invisible to players and parents,
- a coach can propose a goal change without directly replacing the player's goal,
- the player can accept or reject the proposal,
- unread state survives reload and clears only after the related item is read,
- the four-week follow-up state updates from actual registered follow-ups,
- all authorization is enforced in Supabase as well as in the UI.
