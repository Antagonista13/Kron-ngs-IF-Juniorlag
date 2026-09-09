# Admincenter manual SportAdmin sync auth fix

## Goal
Restore the admin-only manual SportAdmin sync button without changing the scheduled sync path.

## Root cause
The Edge Function validates the JWT with `auth.getUser(token)`, but its subsequent `profiles` query uses a Supabase client that does not carry the same Authorization header. RLS therefore sees that profile lookup as anonymous, so the active-admin check fails before a sync run can be recorded.

## TDD plan
1. Add a contract test requiring the admin JWT to be forwarded to the profile lookup client and confirm CI fails for the missing behavior.
2. Make the smallest function change: create the auth/profile Supabase client with `global.headers.Authorization = Bearer <token>`.
3. Re-run CI and verify both SportAdmin and general app tests are green.
4. Deploy the corrected Edge Function, then verify the scheduled path still works. Manual browser verification remains the final user-facing check.
