---
name: supabase-postgres
description: Supabase and PostgreSQL development patterns for the Finance Audit Pro application. Use when designing database schemas, writing migrations, using the Supabase client, implementing RLS policies, or performing PostgreSQL-specific operations. Covers integer paise currency storage, transactions, indexes, and constraints.
---

# Supabase and PostgreSQL Development

## Database Philosophy

- **PostgreSQL as source of truth.** All business logic and constraints live in the database, not just in the code.
- **Integer paise for money.** Store all currency values as `BIGINT` (cents/paise, not floating point). Never use `DECIMAL`, `NUMERIC`, or `FLOAT` for financial data.
- **Write once, read many.** Optimize for write correctness, read performance. Use indexes on frequently queried columns.

## Supabase Client Usage

- **Single client instance.** Create one `SupabaseClient` instance in a core service (`supabase.service.ts`).
- **Never expose service-role key.** Browser code may only use the `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- **Use row-level security (RLS).** All queries must respect RLS policies; never bypass with `serviceRole` in frontend.
- **Handle auth state.** Subscribe to `auth.onAuthStateChange()` to synchronize UI with login state.
- **Type safety.** Generate TypeScript types from your database schema using `supabase gen types typescript`.

## Schema Design Guidelines

- **Normalized where it matters.** Customer data, transactions, and ledgers should have proper foreign keys.
- **Denormalize sparingly.** For read-heavy queries, consider materialized views or computed columns.
- **Use check constraints.** Enforce business rules at the type level (e.g., `amount_paise > 0`).
- **Use unique constraints.** Prevent duplicate entries (e.g., unique constraint on customer ID + week for payment).
- **Use NOT NULL rigorously.** Null columns should be an explicit design choice.

## Row Level Security (RLS)

- Enable RLS on every table that contains user data.
- Write policies that reference `auth.uid()` for owner-based access.
- Test policies in the Supabase SQL editor before deploying.
- Example pattern:
  ```sql
  create policy "Users can view own data"
  on customers for select
  using (owner_id = auth.uid());
  ```

## PostgreSQL Transactions

- Use transactions for multi-step financial operations:
  ```sql
  begin;
  update customer set balance_paise = balance_paise - 500 where id = 1;
  insert into ledger (customer_id, amount_paise, type) values (1, -500, 'payment');
  commit;
  ```
- Consider stored procedures (`plpgsql` functions) for atomic ledger entries.
- Never rely on application-level transactions alone for financial data.

## Indexing Strategy

- Primary key: Auto-created on `id` (UUID or BIGINT).
- Foreign keys: Index all `REFERENCED BY` columns.
- Search columns: Index columns frequently used in `WHERE`, `ORDER BY`, `JOIN`.
- Composite indexes: Create for common multi-column queries (e.g., `(customer_id, created_at)`).

## Common Patterns for Finance Apps

### Payment Allocation Flow
1. Check if payment covers outstanding amounts
2. Insert ledger entry for payment
3. Update customer balance
4. Mark weekly dues as paid if fully covered

### Currency Helper Functions
```ts
// Frontend helper
export function paiseToCurrency(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR'
  });
}
```

## Checklist

- [ ] All money stored as `BIGINT` paise/cents
- [ ] RLS enabled on all user-owned tables
- [ ] Database constraints match application validation
- [ ] Foreign key constraints in place
- [ ] Indexes on primary query columns
- [ ] Auth policies tested in Supabase dashboard
- [ ] Service-role key in environment, never in code