# SportAdmin roster sync plan

## Goal
Synchronize the public Kronäng P2011 SportAdmin roster once per day without automatically activating new players. Only player names are imported; age, contact data and other personal data are ignored. New names become pending candidates that an admin can approve or dismiss.

## Components
- `supabase/migrations/202609081500_sportadmin_roster_sync.sql`: candidate table, RLS/RPCs and scheduled sync support.
- `supabase/functions/sportadmin-roster-sync/index.ts`: fetch fixed P2011 public roster page, extract player names only, compare with `players`, upsert pending candidates.
- `sportadmin-sync-admin.js`: admin-only UI for pending candidates and manual refresh.
- `tests/sportadmin-roster-sync.test.js`: contract coverage for privacy, source, admin approval and scheduling.
- `index.html` and CI workflow: load and test the feature.

## Flow
1. Daily job invokes the roster sync function.
2. Function fetches the fixed SportAdmin P2011 roster page and extracts only names in the player section.
3. Existing player names are ignored.
4. Unknown names are inserted as `pending` candidates.
5. Admin can approve a candidate; approval creates/activates the player record and marks candidate approved.
6. Admin can dismiss false matches.
7. Admin can manually trigger a refresh from the Admin page.

## Safety
No automatic app access is granted. No age, birth date, phone, email or guardian data is stored from SportAdmin. Sync input is fixed server-side rather than user-controlled.
