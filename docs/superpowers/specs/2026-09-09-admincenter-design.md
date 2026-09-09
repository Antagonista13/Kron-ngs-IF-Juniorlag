# Admincenter Design

## Goal
Create an admin-only operational dashboard inside Kronäng Junior so the administrator can see whether the app's critical integrations are healthy without opening GitHub or Supabase for routine checks.

## Scope
Admincenter will be shown inside the existing Admin area and only for active `admin` users. It will contain four status cards and one manual action:

- **SportAdmin sync**: last successful sync time, result, number found/imported, and a clear green/red/unknown state.
- **Manual SportAdmin sync**: a button that invokes the existing `sportadmin-roster-sync` Edge Function using the signed-in admin session, then refreshes the status card.
- **Supabase**: confirm that the signed-in session can reach Supabase and read the admin profile.
- **GitHub CI / deployment**: read public GitHub Actions data for the repository and show the most recent relevant workflow/deployment state. This uses public repository metadata only; no GitHub token is exposed in the app.

The first version will not manage secrets, migrations, users, GitHub settings, or Supabase settings from the dashboard. Those remain protected administrative operations outside the browser app.

## Architecture

### UI
A new `admin-center.js` module will render an `ADMINCENTER` section in `adminPage`. The UI will use compact status cards with clear labels: `GRÖN`, `VARNING`, `FEL`, or `OKÄND`. The section should fit the existing black/white/gold visual language and avoid adding another main bottom-navigation item.

### SportAdmin run history
A new table `public.sportadmin_sync_runs` will store one row per completed sync attempt with:

- `id uuid`
- `started_at timestamptz`
- `finished_at timestamptz`
- `status text` (`success` or `failure`)
- `found integer`
- `imported integer`
- `source text`
- `error_message text nullable`
- `triggered_by text` (`scheduled` or `admin`)

RLS will allow active admins to read the table. Writes will be performed only by the Edge Function through the service-role client.

The existing `sportadmin-roster-sync` Edge Function will create a run record for both success and failure. Admin-triggered calls will be detected from the valid user JWT. Calls using the server sync secret will be classified as scheduled.

### Supabase status
Admincenter will call `auth.getSession()` and then read the current profile. A valid active admin profile produces a green Supabase status. Authentication/query failures produce a red status; no session produces unknown/blocked and the Admincenter remains inaccessible through the existing access gate.

### GitHub status
The browser will query GitHub's public REST endpoint for Actions runs on `Antagonista13/Kron-ngs-IF-Juniorlag`. It will summarize the latest run for the key test/deployment workflows. The app will not store or request a GitHub access token. If GitHub rate-limits or is unavailable, the card shows `OKÄND` rather than treating the app as broken.

## Security
- Admincenter rendering requires the existing admin role/access gate and performs its own `role === 'admin' && is_active === true` check before loading operational data.
- No service-role key, GitHub token, SportAdmin sync secret, or other secret is exposed to JavaScript.
- Manual SportAdmin sync uses the signed-in Supabase admin JWT, not the scheduled sync secret.
- `sportadmin_sync_runs` contains operational metadata only; no player contact data is stored in it.
- Public GitHub API data is limited to the already-public repository and workflow state.

## User experience
The section should answer five questions at a glance:

1. Fungerar SportAdmin-synken?
2. När kördes den senast?
3. Hur många spelare hittades/importerades?
4. Är Supabase-anslutningen frisk?
5. Är senaste GitHub-körningen grön?

`KÖR SPORTADMIN-SYNK NU` shows a busy state while running, then a success/error message and refreshes the card. No destructive operation is included.

## Testing
Development follows TDD. Regression tests will verify:

- only admins can activate Admincenter logic;
- no secret values or service-role keys appear in browser code;
- the Edge Function records success and failure sync runs;
- the sync-run table is admin-readable only;
- the manual sync uses the authenticated session path;
- GitHub status parsing handles success, failure, in-progress, and unavailable states;
- `index.html` loads the Admincenter asset exactly once;
- existing Player/Coach/Admin role and SportAdmin tests remain green.

## Delivery
This will be implemented on branch `feat/admincenter` and proposed as PR #146 (or the next available PR number). Database migration and Edge Function changes must be deployed to Supabase before the feature can be considered live. The GitHub secret/Supabase Edge Function secret configuration remains a separate prerequisite for scheduled nightly sync and is not bypassed by Admincenter.