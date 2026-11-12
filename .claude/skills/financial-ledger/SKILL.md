---
name: financial-ledger
description: Financial ledger and transaction integrity patterns for the Finance Audit Pro application. Use when implementing payment allocation, balance calculations, audit trails, idempotency, reversals, or any financial data operations. Covers PostgreSQL constraints, ledger model design, and financial correctness rules.
---

# Financial Ledger and Transaction Integrity

## Core Principles

- **Money is BIGINT paise.** Never use floats. Every monetary value in the database is `BIGINT`.
- **Ledger is append-only.** Financial records are inserted, never deleted or edited. Corrections use reversal entries.
- **Database is source of truth.** Constraints and transactions live in PostgreSQL, not just in the UI.
- **Every financial operation is auditable.** Every change to money state has a corresponding audit log entry.

## Ledger Model

### Core Tables

```sql
-- Customer balances
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ledger entries (append-only financial records)
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  amount_paise BIGINT NOT NULL, -- positive = debit/charge, negative = credit/payment
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'weekly_due', 'payment', 'partial_payment', 'reversal', 'adjustment'
  )),
  reference_id BIGINT, -- links to payment, weekly_due, or other record
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly dues schedule
CREATE TABLE weekly_dues (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  due_amount_paise BIGINT NOT NULL CHECK (due_amount_paise >= 0),
  paid_amount_paise BIGINT NOT NULL DEFAULT 0 CHECK (paid_amount_paise >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'waived')),
  UNIQUE (customer_id, week_start)
);

-- Collections/payments
CREATE TABLE collections (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mode TEXT CHECK (mode IN ('cash', 'upi', 'bank_transfer', 'online')),
  reference_no TEXT,
  notes TEXT,
  reconciled BOOLEAN NOT NULL DEFAULT false
);

-- Absence records
CREATE TABLE absences (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  reason TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (customer_id, week_start)
);

-- Audit log
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'reversal')),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Financial Rules

### Payment Allocation
1. When a payment is received, allocate it to the oldest unpaid weekly dues first (FIFO).
2. If payment exceeds the oldest due, allocate remaining to the next oldest due.
3. Partial payments are allowed — mark the due as `partial` status.
4. Never allocate a payment to a future week before the current week is fully paid.

### Balance Calculation
```sql
-- Customer outstanding balance
SELECT
  COALESCE(SUM(due_amount_paise), 0) - COALESCE(SUM(paid_amount_paise), 0)
  AS outstanding_paise
FROM weekly_dues
WHERE customer_id = :customer_id;
```

### Carry-Forward Rules
- Unpaid amounts carry forward to the next week's balance.
- If a customer is absent and approved, the weekly due for that week is waived (not carried forward).
- If absent but not approved, the due is still owed and carries forward.
- Suspension/pause periods must be explicitly recorded and approved.

### Reversals
- Never delete a payment. Create a reversal entry with `entry_type = 'reversal'`.
- Reversals must reference the original transaction.
- Reversals must be recorded in `audit_logs`.

## Idempotency

- Use a unique constraint on `(customer_id, week_start)` in `weekly_dues` to prevent duplicate weekly entries.
- Use a unique constraint on `(customer_id, reference_no)` in `collections` where applicable.
- For online payments, use an idempotency key stored in the payment record.

## Audit Trail

- Every insert/update/delete on financial tables must trigger an audit log entry.
- Use PostgreSQL triggers or application-level audit writes.
- Audit logs are append-only; never edit or delete them.

## Checklist

- [ ] All monetary values stored as `BIGINT` paise
- [ ] Ledger is append-only (no UPDATE/DELETE on financial records)
- [ ] Reversals used instead of deletions
- [ ] Audit log entries created for all financial changes
- [ ] Payment allocation follows FIFO rule
- [ ] Idempotency constraints prevent duplicate submissions
- [ ] Balance calculation uses SQL, not just application code
- [ ] Carry-forward rules are documented and tested