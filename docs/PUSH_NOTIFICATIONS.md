# Push Notifications (PWA) — Setup

Phase E of the PWA expansion. The client (Angular + `@angular/service-worker`) can subscribe a device to push notifications and store the subscription in Supabase. Sending requires VAPID keys and a server-side sender.

## 1. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

This prints a **public** and **private** key. Keep the private key secret.

## 2. Configure Supabase secrets

```bash
supabase secrets set VAPID_PUBLIC_KEY=<public>
supabase secrets set VAPID_PRIVATE_KEY=<private>
supabase secrets set VAPID_SUBJECT=mailto:you@example.com
```

## 3. Apply the migration

Run `supabase/migrations/202611240001_push_subscriptions.sql` against your project (adds `push_subscriptions` with RLS).

## 4. Deploy the sender

The skeleton lives at `supabase/functions/send-push/index.ts`. Replace the placeholder with a real implementation using the `web-push` library and the VAPID secrets, then:

```bash
supabase functions deploy send-push
```

## 5. Enable on a device

1. Open the app (installed PWA recommended) → Settings → "Push notifications".
2. Paste the **VAPID public key** into the field.
3. Click "Enable push". The browser will prompt for permission and the subscription is saved to `push_subscriptions`.

## Notes

- `SwPush` only works when the service worker is registered (production build). In `ng serve` (dev) push is disabled by design.
- Each device/browser gets its own subscription row (unique on `profile_id + endpoint`).
- Unsubscribing removes the row.
- The sender edge function must validate the caller's JWT and only send to that caller's own subscriptions (RLS already enforces ownership).
