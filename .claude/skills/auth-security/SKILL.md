---
name: auth-security
description: Authentication and database security patterns for the Finance Audit Pro application. Use when implementing Supabase Auth, Row Level Security (RLS) policies, environment variable handling, or any authorization logic. Covers single-owner security model, secret management, and secure access patterns.
---

# Authentication and Database Security

## Security Model

Finance Audit Pro starts as a **single-owner application**. The owner is the only authenticated user. All data belongs to `owner_id = auth.uid()`. There is no multi-tenant access at this stage.

## Supabase Auth

- Use Supabase Auth (email/password or OAuth) for owner authentication.
- Create a user profile row in `auth.users` (managed by Supabase) and a separate `owners` or `profiles` table for application-specific data.
- Never expose the service-role key to the browser.

## Environment Variable Security

### Required Variables
```
# Public (safe in browser)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side only (NEVER in browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### .gitignore Rules
```
.env
.env.local
.env.*.local
*.log
node_modules/
dist/
```

### Angular Environment Pattern
```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key'
};
```
- Never include `SUPABASE_SERVICE_ROLE_KEY` in Angular environment files.
- Server-side operations (if any) should use a backend function or serverless function.

## Row Level Security (RLS)

### Enable RLS on Every Table
```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

### Owner-Only Policies
```sql
-- Customers
CREATE POLICY "Owner can manage own customers"
ON customers FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Weekly dues
CREATE POLICY "Owner can manage own weekly dues"
ON weekly_dues FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Collections
CREATE POLICY "Owner can manage own collections"
ON collections FOR ALL
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Ledger entries
CREATE POLICY "Owner can view own ledger entries"
ON ledger_entries FOR SELECT
USING (owner_id = auth.uid());

-- Audit logs
CREATE POLICY "Owner can view own audit logs"
ON audit_logs FOR SELECT
USING (owner_id = auth.uid());
```

### Security Principles
- **SELECT**: Owner can only see their own rows.
- **INSERT**: Owner can only insert rows with their own `owner_id`.
- **UPDATE**: Owner can only update their own rows.
- **DELETE**: Owner can only delete their own rows.
- **Audit logs**: Read-only for owner, insert-only via triggers.

## Authorization Boundaries

- **Never bypass RLS.** Even in server-side code, use the anon key with RLS, not the service-role key.
- **Validate in database.** Don't trust UI validation. Database constraints are the final gate.
- **Check ownership on every query.** If a query doesn't filter by `owner_id = auth.uid()`, it's a security risk.

## Secure Coding Patterns

### Supabase Client Setup
```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### Auth Guard (Angular)
```ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async.CanActivate(): Promise<boolean> {
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (user) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
```

## Security Review Checklist

- [ ] RLS enabled on every user-owned table
- [ ] All policies reference `auth.uid()` for ownership
- [ ] Service-role key is not in any frontend code
- [ ] `.env` files are in `.gitignore`
- [ ] Angular environment files contain only public keys
- [ ] Auth guard protects all protected routes
- [ ] Database constraints enforce business rules
- [ ] No public access to any table without auth
- [ ] Audit logs are append-only