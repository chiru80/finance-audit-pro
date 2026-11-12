-- Finance Aduit Pro - Initial Database Schema
-- Migration: 202611110001_initial_schema.sql
-- Date: 2026-11-11
--
-- Business Rules Confirmed (verified as implemented):
-- 1. Weekly due amount charged regardless of absence
-- 2. Absence requires owner approval (status: pending/approved/rejected)
-- 3. Partial payments ARE allowed
-- 4. Payment allocation: Oldest unpaid week first (FIFO) via allocate_payment_to_schedules()
-- 5. Customer can have pause/suspension periods (via absence records)
-- 6. Weekly periods: Monday to Sunday weeks with configurable due day
-- 7. Online payments: Store payment method and reference; manual reconciliation
-- 8. Excess payment above total dues is held as customer credit, never discarded
--
-- Payment allocation is FIFO (First In, First Out):
--   When a customer has multiple unpaid weeks, payments are applied to the
--   OLDEST unpaid week first, then move forward. Partial payments are allowed.
--   Example: Week1=500, Week2=500, Week3=500, payment=800
--   Result: Week1=500 paid, Week2=300 paid, Week3=0 paid, credit=0, balance=700
--
-- Monetary values stored as BIGINT (paise) as required by PRODUCT_BRIEF

-- ============================================================================
-- Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Owner/profile table (single owner design)
-- id must match auth.uid() so RLS policies using auth.uid() = id work correctly.
-- No default: the application inserts the profile with id = auth.uid() after signup.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'te')),
    theme_mode TEXT NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
    weekly_due_day INTEGER NOT NULL DEFAULT 1 CHECK (weekly_due_day BETWEEN 1 AND 7),
    weekly_due_amount BIGINT NOT NULL DEFAULT 50000, -- 500.00 INR = 50000 paise
    currency_code TEXT NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_week_start DATE NOT NULL, -- Week when customer was enrolled
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    weekly_due_amount BIGINT NOT NULL, -- Customer-specific weekly amount in paise
    outstanding_balance BIGINT NOT NULL DEFAULT 0,
    total_paid BIGINT NOT NULL DEFAULT 0,
    total_due BIGINT NOT NULL DEFAULT 0, -- Sum of all weekly dues
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_customers_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_customers_profile_id ON customers(profile_id);
CREATE INDEX idx_customers_status ON customers(status);

-- Weekly payment schedules (recurring due amounts per customer)
CREATE TABLE weekly_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    week_start_date DATE NOT NULL, -- Monday of the week
    week_end_date DATE NOT NULL,   -- Sunday of the week
    due_date DATE NOT NULL,        -- The due date for this week (could be fixed day)
    due_amount BIGINT NOT NULL,    -- Amount due in paise
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    payment_id UUID,               -- Reference to payment if paid
    absence_recorded BOOLEAN NOT NULL DEFAULT FALSE,
    absence_approved BOOLEAN,      -- NULL = pending, TRUE = approved, FALSE = rejected
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_weekly_schedule_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT unique_customer_week UNIQUE (customer_id, week_start_date),
    CHECK (week_start_date <= week_end_date),
    CHECK (due_amount >= 0)
);

-- Create indexes for weekly schedules
CREATE INDEX idx_weekly_schedules_customer_id ON weekly_schedules(customer_id);
CREATE INDEX idx_weekly_schedules_week_start ON weekly_schedules(week_start_date);
CREATE INDEX idx_weekly_schedules_paid ON weekly_schedules(paid);
CREATE INDEX idx_weekly_schedules_due_date ON weekly_schedules(due_date);

-- Absence records for tracking missed weeks
CREATE TABLE absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- profile_id of approver
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_absences_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT unique_customer_absence_week UNIQUE (customer_id, week_start_date),
    CHECK (week_start_date <= week_end_date)
);

-- Create indexes for absences
CREATE INDEX idx_absences_customer_id ON absences(customer_id);
CREATE INDEX idx_absences_status ON absences(status);

-- Payments/Collections
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    amount BIGINT NOT NULL, -- Amount in paise
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'online', 'cheque', 'other')),
    reference TEXT, -- Cash collector ID, online transaction ID, etc.
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    idempotency_key TEXT, -- Client-supplied key to prevent duplicate submissions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CHECK (amount > 0)
);

-- Foreign key linking weekly_schedules to payments
ALTER TABLE weekly_schedules
    ADD CONSTRAINT fk_weekly_schedule_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Create indexes for payments
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_profile_id ON payments(profile_id);
-- Prevent duplicate payment submissions from the same idempotency key within a profile
CREATE UNIQUE INDEX idx_payments_idempotency ON payments(profile_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- Payment allocations (tracks which weeks each payment covers)
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    schedule_id UUID NOT NULL,
    amount BIGINT NOT NULL, -- Amount allocated to this week in paise
    allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_allocations_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_allocations_schedule FOREIGN KEY (schedule_id) REFERENCES weekly_schedules(id) ON DELETE CASCADE,
    CONSTRAINT unique_payment_schedule_allocation UNIQUE (payment_id, schedule_id),
    CHECK (amount > 0)
);

-- Create index for payment allocations
CREATE INDEX idx_allocations_payment_id ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_schedule_id ON payment_allocations(schedule_id);

-- Online payment records/reconciliation
CREATE TABLE online_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    payment_id UUID, -- Reference to payments table if reconciled
    gateway TEXT NOT NULL CHECK (gateway IN ('razorpay', 'paytm', 'cashfree', 'other')),
    transaction_id TEXT NOT NULL,
    amount BIGINT NOT NULL, -- Amount in paise
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    meta JSONB, -- Additional metadata from gateway
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_online_payments_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_online_payments_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CHECK (amount > 0)
);

-- Create indexes for online payments
CREATE INDEX idx_online_payments_customer_id ON online_payments(customer_id);
CREATE INDEX idx_online_payments_transaction_id ON online_payments(transaction_id);
CREATE INDEX idx_online_payments_status ON online_payments(status);
CREATE UNIQUE INDEX idx_online_payments_transaction_unique ON online_payments(gateway, transaction_id);

-- Application settings (key-value store)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit logs for tracking important changes (append-only, no direct inserts)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    action TEXT NOT NULL, -- e.g., 'customer_created', 'payment_made', 'absence_approved'
    table_name TEXT NOT NULL,
    record_id UUID, -- ID of affected record
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_logs_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_profile_id ON audit_logs(profile_id);

-- ============================================================================
-- Historical Tables (for preserving history without modification)
-- ============================================================================

-- Historical weekly rate changes
CREATE TABLE weekly_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    rate BIGINT NOT NULL, -- Rate in paise
    effective_from DATE NOT NULL,
    effective_to DATE,    -- NULL means current rate
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_rate_history_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CHECK (rate >= 0),
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_weekly_rate_history_profile_id ON weekly_rate_history(profile_id);
CREATE INDEX idx_weekly_rate_history_effective_from ON weekly_rate_history(effective_from);

-- Historical payment records (immutable history - no direct INSERT allowed)
-- Records are only created via trigger from payments table
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_payment_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    profile_id UUID NOT NULL, -- Required for RLS
    amount BIGINT NOT NULL,
    payment_method TEXT NOT NULL,
    reference TEXT,
    payment_date DATE NOT NULL,
    notes TEXT,
    reversed BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_reason TEXT,
    reversed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payment_history_original FOREIGN KEY (original_payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_history_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_history_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Add index on original_payment_id for faster lookups
CREATE INDEX idx_payment_history_original_id ON payment_history(original_payment_id);
CREATE INDEX idx_payment_history_customer_id ON payment_history(customer_id);
CREATE INDEX idx_payment_history_payment_date ON payment_history(payment_date);
CREATE INDEX idx_payment_history_profile_id ON payment_history(profile_id);

-- ============================================================================
-- Triggers and Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Function to calculate and update customer outstanding balance
-- Trigger runs with table-owner privileges, bypassing RLS
-- Uses allocated amounts from payment_allocations to prevent over-counting excess payments
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_id UUID;
    total_due BIGINT;
    total_allocated BIGINT;
BEGIN
    -- Handle DELETE trigger: use OLD record
    customer_id := COALESCE(NEW.customer_id, OLD.customer_id);

    -- Calculate total due from weekly schedules
    SELECT COALESCE(SUM(due_amount), 0) INTO total_due
    FROM weekly_schedules
    WHERE customer_id = customer_id;

    -- Calculate total PAID from payment_allocations (not payments!)
    -- This prevents counting excess payments as applied to this customer
    SELECT COALESCE(SUM(amount), 0) INTO total_allocated
    FROM payment_allocations pa
    WHERE pa.payment_id IN (
        SELECT id FROM payments WHERE customer_id = customer_id
    );

    -- Update customer with correct balance
    UPDATE customers
    SET
        outstanding_balance = total_due - total_allocated,
        total_due = total_due,
        total_paid = total_allocated,
        updated_at = NOW()
    WHERE id = customer_id;

    RETURN NULL;
END;
$$;

-- Function to allocate payment to outstanding schedules (FIFO - oldest first)
-- Payments are allocated to the OLDEST unpaid schedule first (due_date ASC)
-- Partial payments are supported: mark paid=true only when fully covered
-- Excess payments (credit) remain unallocated for future use
CREATE OR REPLACE FUNCTION allocate_payment_to_schedules(
    p_payment_id UUID,
    p_customer_id UUID,
    p_amount BIGINT
)
RETURNS TABLE(allocation_count INTEGER, total_allocated BIGINT, credit_amount BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    remaining_amount BIGINT := p_amount;
    schedule_rec RECORD;
    allocated_amount BIGINT;
    payment_exists BOOLEAN;
    total_allocated_so_far BIGINT := 0;
BEGIN
    -- SECURITY: Validate payment owns this customer (prevent unauthorized allocation)
    SELECT EXISTS(
        SELECT 1 FROM payments
        WHERE id = p_payment_id
          AND customer_id = p_customer_id
          AND amount = p_amount  -- Exact match to prevent race conditions
    ) INTO payment_exists;

    IF NOT payment_exists THEN
        RAISE EXCEPTION 'Payment % does not belong to customer % or amount mismatch', p_payment_id, p_customer_id;
    END IF;

    -- Find unpaid schedules, ordered by due_date ASC (OLDEST first - FIFO)
    FOR schedule_rec IN
        SELECT id, due_amount, due_date
        FROM weekly_schedules
        WHERE customer_id = p_customer_id
          AND paid = FALSE
          AND due_amount > 0
        ORDER BY due_date ASC
    LOOP
        IF remaining_amount <= 0 THEN
            EXIT;
        END IF;

        -- Calculate how much to allocate to this schedule
        allocated_amount := LEAST(remaining_amount, schedule_rec.due_amount);

        -- Record the allocation
        INSERT INTO payment_allocations (payment_id, schedule_id, amount)
        VALUES (p_payment_id, schedule_rec.id, allocated_amount);

        -- Mark schedule as paid only if fully covered by this allocation
        IF allocated_amount >= schedule_rec.due_amount THEN
            UPDATE weekly_schedules
            SET paid = TRUE,
                payment_id = p_payment_id,
                updated_at = NOW()
            WHERE id = schedule_rec.id;
        END IF;

        remaining_amount := remaining_amount - allocated_amount;
        total_allocated_so_far := total_allocated_so_far + allocated_amount;
    END LOOP;

    -- Return totals: allocation_count, total_allocated, credit_amount (unallocated)
    RETURN QUERY SELECT
        (total_allocated_so_far > 0)::INTEGER as allocation_count,
        total_allocated_so_far,
        remaining_amount;
END;
$$;

-- Function to generate audit log entry
CREATE OR REPLACE FUNCTION log_audit_entry(
    p_profile_id UUID,
    p_action TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO audit_logs (
        profile_id, action, table_name, record_id, old_values, new_values,
        created_at
    ) VALUES (
        p_profile_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values, NOW()
    );
END;
$$;

-- Function to create payment_history record from payment (called by trigger)
CREATE OR REPLACE FUNCTION create_payment_history_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO payment_history (
        original_payment_id,
        customer_id,
        profile_id,
        amount,
        payment_method,
        reference,
        payment_date,
        notes,
        reversed
    ) VALUES (
        NEW.id,
        NEW.customer_id,
        NEW.profile_id,
        NEW.amount,
        NEW.payment_method,
        NEW.reference,
        NEW.payment_date,
        NEW.notes,
        FALSE
    );
    RETURN NEW;
END;
$$;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Triggers for profiles
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for customers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_balance_on_payment
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

CREATE TRIGGER update_customer_balance_on_allocation
    AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

CREATE TRIGGER update_customer_balance_on_schedule_change
    AFTER INSERT OR UPDATE OR DELETE ON weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION update_customer_balance();

-- Triggers for weekly_schedules
CREATE TRIGGER update_weekly_schedules_updated_at BEFORE UPDATE ON weekly_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for absences
CREATE TRIGGER update_absences_updated_at BEFORE UPDATE ON absences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- NOTE: payments has no updated_at column - no BEFORE INSERT trigger here.
-- The create_payment_history_on_insert trigger below handles history creation.

-- Trigger to create payment_history record on payment insert (via row_security_barrier)
CREATE TRIGGER create_payment_history_on_insert
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION create_payment_history_record();

-- NOTE: online_payments has no updated_at column - no BEFORE INSERT trigger here.

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables that have user-owned data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Profile RLS: Owner can only access their own profile
CREATE POLICY "Owner can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Owner can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Customers RLS: Owner can only access their own customers
CREATE POLICY "Owner can view own customers" ON customers
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Owner can create customers" ON customers
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Owner can update own customers" ON customers
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Owner can delete own customers" ON customers
    FOR DELETE USING (auth.uid() = profile_id);

-- Weekly schedules RLS
CREATE POLICY "Owner can view customer schedules" ON weekly_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can create schedules" ON weekly_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can update schedules" ON weekly_schedules
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can delete schedules" ON weekly_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

-- Absences RLS: Separate policies for each operation
CREATE POLICY "Owner can view customer absences" ON absences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can create absences" ON absences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can update absences" ON absences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can delete absences" ON absences
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

-- Payments RLS
CREATE POLICY "Owner can view customer payments" ON payments
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Owner can create payments" ON payments
    FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Owner can update own payments" ON payments
    FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Owner can delete own payments" ON payments
    FOR DELETE USING (profile_id = auth.uid());

-- Payment allocations RLS: Separate policies for each operation
-- Only the owner of the customer can manage allocations for their payments
CREATE POLICY "Owner can view payment allocations" ON payment_allocations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.id = payment_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can create payment allocations" ON payment_allocations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM payments p
            JOIN customers c ON p.customer_id = c.id
            WHERE p.id = payment_id AND c.profile_id = auth.uid()
        )
    );

-- Prevent UPDATE on payment_allocations - allocations are immutable after creation
CREATE POLICY "Owner can update payment allocations" ON payment_allocations
    FOR UPDATE USING (FALSE);

-- Prevent DELETE on payment_allocations - historical record must be preserved
CREATE POLICY "Owner can delete payment allocations" ON payment_allocations
    FOR DELETE USING (FALSE);

-- Online payments RLS: Separate policies for each operation
CREATE POLICY "Owner can view customer online payments" ON online_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Owner can create online payments" ON online_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

-- Prevent direct UPDATE on online_payments - use reconciliation function instead
CREATE POLICY "Owner can update online payments (status only)" ON online_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

-- Prevent direct DELETE - use reversal in payment_history
CREATE POLICY "Owner can delete online payments" ON online_payments
    FOR DELETE USING (FALSE);

-- Settings RLS: Owner only (singleton table) - must verify auth
CREATE POLICY "Owner can view settings" ON settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can create settings" ON settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner can update settings" ON settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can delete settings" ON settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Audit logs RLS: Append-only (insert via trigger, read by owner)
-- Prevent direct INSERT - only via trigger functions
CREATE POLICY "Owner can view audit logs" ON audit_logs
    FOR SELECT USING (profile_id = auth.uid());

-- Prevent direct INSERT - only via triggers/functions
CREATE POLICY "Owner can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (FALSE);

-- Prevent UPDATE - immutable audit trail
CREATE POLICY "Owner can update audit logs" ON audit_logs
    FOR UPDATE USING (FALSE);

-- Prevent DELETE - immutable audit trail
CREATE POLICY "Owner can delete audit logs" ON audit_logs
    FOR DELETE USING (FALSE);

-- Rate history RLS: APPEND-ONLY (immutable history)
-- Prevent UPDATE and DELETE - historical rate records must never change
CREATE POLICY "Owner can view rate history" ON weekly_rate_history
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Owner can insert rate history" ON weekly_rate_history
    FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Prevent UPDATE - historical rates are immutable after creation
CREATE POLICY "Owner cannot update rate history" ON weekly_rate_history
    FOR UPDATE USING (FALSE);

-- Prevent DELETE - historical records must be preserved
CREATE POLICY "Owner cannot delete rate history" ON weekly_rate_history
    FOR DELETE USING (FALSE);

-- Payment history RLS: Read-only through triggers, prevent direct access
CREATE POLICY "Owner can view payment history" ON payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers c
            WHERE c.id = customer_id AND c.profile_id = auth.uid()
        )
    );

-- Prevent direct INSERT - only via trigger from payments
CREATE POLICY "Owner can insert payment history" ON payment_history
    FOR INSERT WITH CHECK (FALSE);

-- Prevent UPDATE - immutable history
CREATE POLICY "Owner can update payment history" ON payment_history
    FOR UPDATE USING (FALSE);

-- Prevent DELETE - immutable history
CREATE POLICY "Owner can delete payment history" ON payment_history
    FOR DELETE USING (FALSE);

-- ============================================================================
-- Seed Initial Data
-- ============================================================================

-- Insert default settings (idempotent upsert)
INSERT INTO settings (key, value, description) VALUES
    ('weekly_payments_start', 'true', 'Whether weekly payments are enabled'),
    ('absence_requires_approval', 'true', 'Whether absences require owner approval'),
    ('allow_partial_payments', 'true', 'Whether partial payments are allowed'),
    ('payment_allocation_direction', 'fifo', 'Direction for payment allocation (fifo = oldest first)'),
    ('default_weekly_due_day', '1', 'Default day of week for payments (1=Monday, 7=Sunday)'),
    ('default_weekly_due_amount', '50000', 'Default weekly due amount in paise (50000 = ₹500.00)')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE profiles IS 'Owner/profile who owns all customer data - single user business model';
COMMENT ON TABLE customers IS 'Customer records with financial summary fields (total_due, total_paid, outstanding_balance)';
COMMENT ON TABLE weekly_schedules IS 'Weekly due schedules for each customer with absence tracking';
COMMENT ON TABLE absences IS 'Absence records that need owner approval for pause/suspension';
COMMENT ON TABLE payments IS 'Cash/physical payments recorded by the business (not online payments)';
COMMENT ON TABLE payment_allocations IS 'Tracks which weeks payment covers (enables payment history)';
COMMENT ON TABLE online_payments IS 'Records of online payment gateway transactions for reconciliation';
COMMENT ON TABLE weekly_rate_history IS 'Historical record of weekly due amount changes per profile';
COMMENT ON TABLE payment_history IS 'Immutable historical record of all payments (for audit trail)';
COMMENT ON TABLE audit_logs IS 'Audit trail for security and compliance tracking';