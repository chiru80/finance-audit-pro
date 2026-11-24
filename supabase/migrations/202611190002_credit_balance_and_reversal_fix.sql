-- Finance Audit Pro - Credit Balance Column & Reversal State Fix
-- Migration: 202611190002_credit_balance_and_reversal_fix.sql
-- Date: 2026-11-19
-- Fixes:
--   C1: Add credit_balance column to customers; stop discarding overpayment credit
--   H1: Reversal RPC must clear weekly_schedules.paid and payment_id for weeks allocated to reversed payment

-- ============================================================================
-- 1. Add credit_balance column to customers table
-- ============================================================================

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS credit_balance BIGINT NOT NULL DEFAULT 0;

-- Index for credit queries
CREATE INDEX IF NOT EXISTS idx_customers_credit_balance ON customers(credit_balance)
    WHERE credit_balance > 0;

COMMENT ON COLUMN customers.credit_balance IS 'Excess payment held as credit for future dues (paise). Per rule #8: never discarded.';

-- ============================================================================
-- 2. Fix update_customer_balance trigger to track credit separately
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
    v_new_balance BIGINT := 0;
    v_new_credit BIGINT := 0;
BEGIN
    IF TG_TABLE_NAME = 'payments' THEN
        v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
    ELSIF TG_TABLE_NAME = 'weekly_schedules' THEN
        v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
    ELSIF TG_TABLE_NAME = 'payment_allocations' THEN
        SELECT p.customer_id INTO v_customer_id
        FROM payments p
        WHERE p.id = COALESCE(NEW.payment_id, OLD.payment_id);
    END IF;

    IF v_customer_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(SUM(ws.due_amount), 0) INTO v_total_due
    FROM weekly_schedules ws
    WHERE ws.customer_id = v_customer_id;

    SELECT COALESCE(SUM(pa.amount), 0) INTO v_total_allocated
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    LEFT JOIN payment_history ph ON ph.original_payment_id = p.id
    WHERE p.customer_id = v_customer_id
      AND COALESCE(ph.reversed, FALSE) = FALSE;

    -- Calculate net position: allocated - due
    -- Positive = credit, Negative = outstanding balance
    v_new_credit := GREATEST(0, v_total_allocated - v_total_due);
    v_new_balance := GREATEST(0, v_total_due - v_total_allocated);

    UPDATE customers c
    SET
        outstanding_balance = v_new_balance,
        total_paid = v_total_allocated,
        total_due = v_total_due,
        credit_balance = v_new_credit,
        updated_at = NOW()
    WHERE c.id = v_customer_id;

    RETURN NULL;
END;
$$;


-- ============================================================================
-- 3. Fix reverse_payment to clear weekly_schedules for reversed allocations
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_payment(
    p_payment_id UUID,
    p_reason TEXT
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_customer_id UUID;
    v_already_reversed BOOLEAN;
BEGIN
    IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
        RETURN QUERY SELECT FALSE, 'A reversal reason is required';
        RETURN;
    END IF;

    SELECT p.profile_id, p.customer_id
    INTO v_profile_id, v_customer_id
    FROM payments p
    WHERE p.id = p_payment_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Payment not found';
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 'Access denied';
        RETURN;
    END IF;

    SELECT COALESCE(ph.reversed, FALSE) INTO v_already_reversed
    FROM payment_history ph
    WHERE ph.original_payment_id = p_payment_id;

    IF v_already_reversed THEN
        RETURN QUERY SELECT FALSE, 'Payment is already reversed';
        RETURN;
    END IF;

    -- Clear weekly_schedules that were paid by this payment
    -- This allows those weeks to be re-allocated by future payments
    UPDATE weekly_schedules
    SET paid = FALSE,
        payment_id = NULL,
        updated_at = NOW()
    WHERE customer_id = v_customer_id
      AND payment_id = p_payment_id
      AND paid = TRUE;

    -- Mark payment as reversed in history
    UPDATE payment_history
    SET reversed = TRUE,
        reversed_reason = p_reason,
        reversed_at = NOW()
    WHERE original_payment_id = p_payment_id;

    PERFORM log_audit_entry(
        v_profile_id,
        'payment_reversed',
        'payments',
        p_payment_id,
        NULL,
        jsonb_build_object('reason', p_reason, 'customer_id', v_customer_id)
    );

    RETURN QUERY SELECT TRUE, NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION reverse_payment(UUID, TEXT) TO authenticated;


-- ============================================================================
-- 4. Backfill credit_balance for existing customers
-- ============================================================================

UPDATE customers c
SET credit_balance = GREATEST(0, (
    SELECT COALESCE(SUM(pa.amount), 0)
    FROM payment_allocations pa
    JOIN payments p ON p.id = pa.payment_id
    LEFT JOIN payment_history ph ON ph.original_payment_id = p.id
    WHERE p.customer_id = c.id
      AND COALESCE(ph.reversed, FALSE) = FALSE
) - c.total_due)
WHERE credit_balance = 0;