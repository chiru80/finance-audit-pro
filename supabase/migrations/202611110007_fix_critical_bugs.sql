-- Finance Audit Pro - Fix Critical Database Bugs & Triggers
-- Migration: 202611110007_fix_critical_bugs.sql
-- Date: 2026-11-17

-- ============================================================================
-- 1. Fix update_customer_balance Trigger Function
-- Addresses:
--   a) Ambiguous column reference 'customer_id = customer_id'
--   b) Missing customer_id column error when called from payment_allocations trigger
--   c) Table-specific customer_id resolution
-- ============================================================================

CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id UUID;
    v_total_due BIGINT := 0;
    v_total_allocated BIGINT := 0;
BEGIN
    -- Determine customer_id based on TG_TABLE_NAME
    IF TG_TABLE_NAME = 'payments' THEN
        v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
    ELSIF TG_TABLE_NAME = 'weekly_schedules' THEN
        v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
    ELSIF TG_TABLE_NAME = 'payment_allocations' THEN
        -- Lookup customer_id from payments via payment_id
        SELECT p.customer_id INTO v_customer_id
        FROM payments p
        WHERE p.id = COALESCE(NEW.payment_id, OLD.payment_id);
    END IF;

    IF v_customer_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Calculate total due from weekly schedules
    SELECT COALESCE(SUM(ws.due_amount), 0) INTO v_total_due
    FROM weekly_schedules ws
    WHERE ws.customer_id = v_customer_id;

    -- Calculate total paid from payment_allocations
    SELECT COALESCE(SUM(pa.amount), 0) INTO v_total_allocated
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    WHERE p.customer_id = v_customer_id;

    -- Update customer balance summary
    UPDATE customers c
    SET
        outstanding_balance = GREATEST(0, v_total_due - v_total_allocated),
        total_paid = v_total_allocated,
        total_due = v_total_due,
        updated_at = NOW()
    WHERE c.id = v_customer_id;

    RETURN NULL;
END;
$$;


-- ============================================================================
-- 2. Add Default to enrollment_week_start in customers Table
-- Ensures inserts without explicit enrollment_week_start default to week start.
-- ============================================================================

ALTER TABLE customers 
    ALTER COLUMN enrollment_week_start SET DEFAULT date_trunc('week', CURRENT_DATE)::date;


-- ============================================================================
-- 3. Fix transactions View (Eliminate Double-Counting)
-- Replaces UNION ALL payments + payment_history with single payments query
-- because every payment insertion fires a trigger creating a payment_history row.
-- ============================================================================

CREATE OR REPLACE VIEW transactions
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.customer_id,
    c.name AS customer_name,
    p.amount,
    p.payment_date AS date,
    CASE
        WHEN p.payment_method IN ('cash', 'online', 'cheque') THEN 'collection'
        ELSE 'payment'
    END AS type,
    CASE
        WHEN p.payment_method = 'online' AND EXISTS (
            SELECT 1 FROM online_payments op
            WHERE op.payment_id = p.id AND op.status = 'completed'
        ) THEN 'paid'
        WHEN p.payment_method != 'online' THEN 'paid'
        ELSE 'pending'
    END AS status,
    p.reference AS description
FROM payments p
JOIN customers c ON c.id = p.customer_id;

GRANT SELECT ON transactions TO authenticated;


-- ============================================================================
-- 4. Fix online_payments Table & Update Status RPC
-- Add updated_at column to online_payments and update trigger/RPC
-- ============================================================================

ALTER TABLE online_payments 
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TRIGGER update_online_payments_updated_at 
    BEFORE UPDATE ON online_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_online_payment_status(
    p_payment_id UUID,
    p_new_status TEXT,
    p_paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id UUID;
    v_profile_id UUID;
BEGIN
    IF p_new_status NOT IN ('pending', 'completed', 'failed', 'refunded') THEN
        RETURN QUERY SELECT FALSE, 'Invalid status: must be pending, completed, failed, or refunded';
        RETURN;
    END IF;

    SELECT c.id, c.profile_id
    INTO v_customer_id, v_profile_id
    FROM customers c
    JOIN online_payments op ON op.customer_id = c.id
    WHERE op.payment_id = p_payment_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Online payment record not found';
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 'Access denied';
        RETURN;
    END IF;

    UPDATE online_payments
    SET status = p_new_status,
        paid_at = COALESCE(p_paid_at, NOW()),
        updated_at = NOW()
    WHERE payment_id = p_payment_id;

    RETURN QUERY SELECT TRUE, NULL;
END;
$$;
