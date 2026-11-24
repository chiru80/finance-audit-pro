# Security hardening — operator steps

Migration `202611110006_security_hardening.sql` is source-only until it is
applied. It contains no data changes to customer/payment records. Apply it with
`supabase db push` or the Supabase SQL Editor, then complete the steps below.

## 1. Apply the migration

```bash
supabase db push
```

Or paste `supabase/migrations/202611110006_security_hardening.sql` into the
Supabase SQL Editor and run it.

## 2. Provision the owner (required once)

Until this row exists, `settings` is readable by nobody (fail closed), and
non-owner signups are no longer auto-confirmed. In the Supabase SQL Editor:

```sql
INSERT INTO public.app_owners (email, user_id)
VALUES (
  'owner@example.com', -- replace with the real owner email
  (SELECT id FROM auth.users WHERE lower(email) = lower('owner@example.com'))
)
ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id;
```

Verify:

```sql
SELECT email, user_id FROM public.app_owners;
SELECT public.is_app_owner(); -- run as the signed-in owner: must return true
```

If `user_id` is NULL, the auth user was not found for that email. Create the
owner account first (Supabase Dashboard -> Authentication -> Users -> Invite),
then re-run the INSERT.

## 3. Disable public signup at the provider

The UI no longer exposes `/signup`, but the anon key is public, so the server
must be authoritative:

- Supabase Dashboard -> Authentication -> Providers -> Email
- Turn **off** "Allow new users to sign up" (or enforce email confirmation and
  invite-only onboarding).

## 4. Post-apply verification (no production writes)

As the signed-in owner, confirm nothing regressed:

- `/settings` loads and a test setting can be saved.
- Record a test payment; it still allocates weeks and updates balances.
- Audit entries are still written by the payment/absence RPCs.

Then confirm the hardened helpers are not callable directly over PostgREST:

```sql
-- Run as a signed-in authenticated user (not postgres/service_role):
SELECT public.log_audit_entry(gen_random_uuid(), 'x', 'x', gen_random_uuid());
-- Expected: permission denied

SELECT public.allocate_payment_to_schedules(gen_random_uuid(), gen_random_uuid(), 1);
-- Expected: permission denied
```

## What changed

- `public.app_owners` — owner allowlist, no policies for anon/authenticated.
- `public.is_app_owner()` — owner check used by `settings` RLS and `adminGuard`.
- `settings` RLS — now `is_app_owner()` instead of any authenticated role.
- `auto_confirm_new_user()` — auto-confirms only the allowlisted owner email.
- `log_audit_entry()` — rejects `profile_id` differing from `auth.uid()`.
- `allocate_payment_to_schedules()` — requires the payment to belong to the
  caller before allocating.
- Direct `EXECUTE` on both privileged helpers revoked from
  `PUBLIC`, `anon`, and `authenticated`.

> Do not re-run `202611110004_grant_permissions.sql` after this migration:
> its blanket `GRANT ALL ON ALL ROUTINES` would restore direct RPC execution.
> If it must be re-applied, re-run the two `REVOKE` statements from this
> migration afterwards.

## Angular changes

- Removed the public `/signup` route and the login page's "Create account"
  link. `src/app/auth/signup.component.ts` is now unreferenced; it can be
  deleted in a follow-up cleanup.
- `adminGuard` now calls `is_app_owner` and is wired to `/settings`.
- `src/app/auth/auth.guard.spec.ts` updated for the new owner check.

## Still open (needs local validation before changing)

- `payments` DELETE cascades into `payment_history` despite the append-only
  requirement. Consider a `RESTRICT` FK or a soft-delete RPC.
- `update_customer_balance()` reads `NEW.customer_id` on a
  `payment_allocations` trigger, but that table has no `customer_id` column.
  Confirm with a local fixture before modifying.
