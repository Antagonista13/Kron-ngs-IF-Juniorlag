# KIF Web Push operations

Status: under implementation; general delivery disabled. Phone trial pending.

Code recovery point: `backup/kif-before-push-2026-10-07` at `57189d2c3a4edba47567bb9647b5d494e2553553`. This is a code backup, not a full database backup.

All new tables are additive. Never delete original posts, messages, reads, profiles or players as part of rollback.

## Stop and rollback

1. `update public.push_config set delivery_enabled=false, pilot_profile_id=null;`
2. Unschedule only the `kif-push-dispatch` cron job: `select cron.unschedule(jobid) from cron.job where jobname='kif-push-dispatch';`
3. If event capture should stop, remove only `kif_push_post_insert`, `kif_push_message_insert`, `kif_push_message_read` and `kif_push_job_wake` triggers.
4. Revert frontend through a reviewed GitHub PR to the backup branch. Retain the additive notification tables pending deliberate cleanup.

Vault stores the worker token and private VAPID key. Only service-role RPCs can expose worker config. Never print config results, keys, authorization headers or subscriptions. Only the public VAPID key may be returned to players.

## First-time keys and diagnostics

The authenticated worker accepts `{"action":"initialize"}` exactly once. It generates VAPID keys inside the Edge runtime and stores the private key via `configure_push_keys` directly in Vault. Keys never pass through CLI output. Existing keys cannot be replaced through this command. The VAPID contact is the public app URL.

Run initialization with a server-side `net.http_post` to `push_config.function_url`, taking the authorization value from Vault using a subquery; do not select or print the token. Inspect only the returned request ID and the non-secret response (`configured: true`).

General delivery remains `false` and `pilot_profile_id` remains null. After frontend merge, select an explicitly agreed active player account for Henric's iPhone trial and set only `pilot_profile_id`. An admin account is not a player push recipient. After the observed trial succeeds, clear the pilot and enable general delivery for opted-in players.

Disabled periods do not accumulate delivery jobs. Unread notifications for enabled categories may still be recorded. Enabling delivery does not send old entries.

`claim_push_jobs(20)` leases a small batch; delivery uses ten parallel requests with ten-second timeouts. Retry after 1/5/30 minutes, maximum four attempts. Subscription 404/410 disables the device. Wrong, stale and expired lease tokens cannot complete a job.

SQL validation: `npm ci --prefix supabase/tests`, then `npm run test:push --prefix supabase/tests` and `npm run test:dom --prefix supabase/tests`. Local Vault/cron/network are explicit stubs; live tests are transactional and roll back every fixture.

Expected security-advisor informational notices: service-only `push_config` and `push_delivery_jobs` have RLS with no client policy; own-player RPCs deliberately use SECURITY DEFINER with explicit authenticated grants, auth.uid ownership checks and fixed search_path. Anonymous and cross-account access are denied in SQL tests.

## Phone trial checklist

On an installed iPhone app using the agreed player login: activate permission; send own-device test; close app and receive a new post and leader message; check badge count; click each notification and verify the actual expanded post/own chat; read and check badge decrease; log out and verify this device receives no later notification. Check Android when a device is available.

Keep all-player delivery disabled until this checklist is observed. Test-notification clicks currently open Home; normal post and message clicks open their content.

## Deployment evidence 7 October 2026

Additive migrations `20261007111219_web_push` and `20261007114030_push_key_safe_update` applied. The second migration supplies the explicit singleton WHERE predicate required by PostgREST safeupdate. The real authenticated initialization failed before that fix, then succeeded without exposing keys. Worker authorization and own-device test endpoints reject missing/wrong tokens with HTTP 401. Source fixture SQL ran live and rolled back; preferences, subscriptions, notifications and jobs all returned to zero. Phone trial and frontend publication remain pending.

Final Edge deployment: `kif-push` version 5, bundle SHA256 `64a1fea62b6f565d1ca9afa6a578e0172987e99704cd71acca19770206da7db5`. Authenticated disabled dispatch: HTTP 200, processed 0. Repeat initialization: HTTP 409, original keys retained. Missing/wrong authorization: HTTP 401. Real Web Push encryption is checked with a generated browser ECDH key and a successful decrypt of the generic payload; no real phone delivery claimed.

## Leader message notifications

Apply migration `20261007185320_leader_message_push.sql` before publishing the leader frontend. It adds `push_config.leader_delivery_enabled=false` and extends opt-in RPCs to active `admin`/`coach`. After PR publication, enable only `leader_delivery_enabled=true where singleton`; keep `delivery_enabled` and `pilot_profile_id` unchanged. The existing worker requires no redeployment. Rollback: set `leader_delivery_enabled=false` (do not remove additive schema).

Leaders activate on each device under Profil → Notiser → Aktivera notiser. Their category is Meddelanden only. New player messages fan out to opted-in active same-team staff. A staff reply goes only to the player. Read receipts and notification eligibility remain per recipient; reading or replying never clears another staff member's badge. A notification click opens the source player's chat using RLS-protected lookups. Test with two staff accounts: both unread, first reads → only their badge clears, second remains unread until opening. No permission or silent default subscription changes.

Existing player rollout stays limited to the configured pilot. Leader opt-in does not enable notification delivery to additional players.
