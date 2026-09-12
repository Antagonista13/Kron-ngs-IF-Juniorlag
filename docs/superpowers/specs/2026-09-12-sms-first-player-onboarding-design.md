# SMS-first player onboarding design

## Goal

Allow an administrator to invite a roster player directly from **Laget** using the player's stored mobile number, without requiring the administrator to enter the player's email address first.

## User experience

1. Admin opens **Laget** and selects a player.
2. If the player has no linked account, the player view shows **BJUD IN VIA SMS**.
3. Tapping the button creates a secure, time-limited, single-use onboarding token for that exact player and opens the device SMS composer addressed to the player's stored mobile number.
4. The SMS contains a Kronängs IF Juniorlag onboarding link.
5. The player opens the link and sees an activation screen identifying the player by name.
6. The player enters an email address and chooses a password.
7. The backend validates the onboarding token, creates the Auth account, creates/updates the player profile, links that profile to the correct `players` row, assigns role `player`, marks the token consumed, and signs the player in or returns the user to the normal login flow.
8. Once a player is linked to an account, the team view shows **Konto anslutet** instead of the invite button.

## Security model

- Only an authenticated, active admin may create an onboarding token.
- Tokens are cryptographically random and stored only as a hash in the database.
- A token belongs to exactly one player.
- Tokens expire after a fixed short lifetime (24 hours).
- Tokens are single-use. Consumed, revoked, or expired tokens cannot create accounts.
- Creating a new token for the same player revokes any still-active previous token.
- The public activation endpoint may validate and consume a token, but it may not expose other player records or contact details.
- The service-role key remains server-side only.
- The existing player phone privacy model remains unchanged; the admin-side invite flow may access the protected phone number server-side because the caller is verified as admin.
- If the player already has `profile_id`, token creation must fail and the UI must show the account as connected.
- Email uniqueness is enforced against Supabase Auth when the player completes activation.

## Data model

Add a table dedicated to onboarding tokens, for example `player_onboarding_tokens`:

- `id uuid primary key`
- `player_id uuid not null references players(id) on delete cascade`
- `token_hash text not null unique`
- `expires_at timestamptz not null`
- `consumed_at timestamptz null`
- `revoked_at timestamptz null`
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`

RLS is enabled. No direct anonymous table access is required; token operations happen through Edge Functions using narrowly scoped server-side logic.

## Backend functions

### Create player SMS onboarding invite

A new admin-only Edge Function accepts `playerId`.

It:

1. Verifies the caller with `auth.getUser()`.
2. Verifies caller profile is active admin.
3. Loads the selected active player and rejects if already linked.
4. Loads the protected mobile number.
5. Generates a random token and stores only its SHA-256 hash.
6. Revokes prior unused tokens for that player.
7. Stores the new token with 24-hour expiry.
8. Returns `{ phone, inviteUrl, playerName }`.

The browser then opens the iOS/Android SMS composer with the returned phone number and link.

### Complete player onboarding

A public-facing Edge Function accepts `token`, `email`, and `password`.

It:

1. Hashes the supplied token and finds the matching unexpired, unused, unrevoked token.
2. Locks/validates the row so two requests cannot consume the same token.
3. Confirms the linked player is still active and still has no `profile_id`.
4. Rejects an email already registered in Supabase Auth.
5. Creates the Auth user server-side with confirmed email state appropriate for this closed invitation flow.
6. Creates or updates the user's `profiles` row with role `player` and active access.
7. Links `players.profile_id` to the new Auth user id.
8. Marks the onboarding token consumed.
9. Returns success without exposing privileged credentials.

If account creation succeeds but linking fails, the function must clean up or otherwise leave a recoverable, explicitly handled state rather than silently orphaning the account.

## Frontend changes

### Laget / player view

For admins only:

- Unlinked player: show **BJUD IN VIA SMS**.
- Linked player: show **Konto anslutet**.
- While creating invite: disable button and show progress.
- If no mobile number exists: show a specific message that the player has no stored mobile number.
- If an invite already exists, pressing the button creates a fresh link and invalidates the old one.

The invite action should live where the admin already views the player rather than in the generic Admin invitation form.

### Activation page

Add a focused activation view that works before normal authentication. It should:

- Read the token from the URL.
- Validate token status before showing the form.
- Show the player's name after successful validation.
- Ask only for email and password (plus password confirmation if used elsewhere in the app).
- Show clear states for invalid, expired, or already-used links.
- On success, direct the player into the app/login flow.

## Existing invitation flow

The current email-first invitation system remains available for parents and coaches. The existing `create-player-sms-invite` flow becomes obsolete for players once the SMS-first flow is live; it should be removed or clearly retired after migration so there are not two competing player invitation mechanisms.

## Testing

Tests must cover at least:

- Only admin can create player onboarding tokens.
- Player with linked account cannot be invited.
- Missing mobile number returns a specific error.
- Token is stored hashed, not plaintext.
- A second invite revokes the first token.
- Expired, revoked, and consumed tokens are rejected.
- One token can be consumed only once.
- Existing Auth email is rejected.
- Successful activation creates Auth user, player profile, and `players.profile_id` linkage with role `player`.
- Non-admin UI never exposes the invite action.
- Admin player card shows correct button/state.
- SMS composer receives the stored player phone number and onboarding URL.
- Existing parent and coach invitation behavior remains unchanged.

## Rollout

1. Add schema and backend functions with tests.
2. Add activation page and frontend tests.
3. Add admin invite button to player view in **Laget**.
4. Deploy Edge Functions and schema.
5. Test end-to-end with a real unlinked player.
6. Retire the old player-specific email-first SMS function once the new flow is verified.

## Success criteria

An admin can go from **Laget → player → BJUD IN VIA SMS → Send** without typing an email address. The player can open that SMS link, choose email/password, and end up connected to the correct existing roster player with role `player`, while the link cannot be reused or used for another player.