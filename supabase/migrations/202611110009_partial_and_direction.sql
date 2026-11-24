-- Finance Audit Pro - Partial Payments & Allocation Direction Enforcement
-- Migration: 202611110009_partial_and_direction.sql
-- Date: 2026-11-18

-- ============================================================================
-- 1. Enforce allow_partial_payments and payment_allocation_direction settings
-- ============================================================================

CREATE OR REPLACE FUNCTION record_weekly_payment(
    p_customer_id UUID,
    p_amount_paise BIGINT,
    p_method TEXT,
    p_reference TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    payment_id UUID,
    error_message TEXT,
    allocated_paise BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_payment_id UUID;
    v_allocated BIGINT;
    v_allow_partial BOOLEAN := TRUE;
    v_direction TEXT := 'fifo';
    v_oldest_due BIGINT;
BEGIN
    IF p_amount_paise <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL, 'Amount must be greater than 0', 0;
        RETURN;
    END IF;

    IF p_method NOT IN ('cash', 'online', 'cheque', 'other') THEN
        RETURN QUERY SELECT FALSE, NULL, 'Invalid payment method', 0;
        RETURN;
    END IF;

    SELECT c.profile_id
    INTO v_profile_id
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL, 'Customer not found', 0;
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, NULL, 'Access denied - customer does not belong to you', 0;
        RETURN;
    END IF;

    SELECT COALESCE((SELECT value FROM settings WHERE key = 'allow_partial_payments'), 'true') = 'true'
    INTO v_allow_partial;

    SELECT COALESCE((SELECT value FROM settings WHERE key = 'payment_allocation_direction'), 'fifo')
    INTO v_direction;

    IF NOT v_allow_partial THEN
        SELECT ws.due_amount INTO v_oldest_due
        FROM weekly_schedules ws
        WHERE ws.customer_id = p_customer_id
          AND ws.paid = FALSE
          AND ws.due_amount > 0
        ORDER BY ws.due_date ASC
        LIMIT 1;

        IF v_oldest_due IS NOT NULL AND p_amount_paise < v_oldest_due THEN
            RETURN QUERY SELECT FALSE, NULL, 'Partial payments are disabled; amount must cover the oldest unpaid week', 0;
            RETURN;
        END IF;
    END IF;

    INSERT INTO payments (
        customer_id, profile_id, amount, payment_method, reference, payment_date, notes, created_at
    ) VALUES (
        p_customer_id, v_profile_id, p_amount_paise, p_method, p_reference, CURRENT_DATE, p_notes, NOW()
    ) RETURNING id INTO v_payment_id;

    PERFORM allocate_payment_to_schedules(p_payment_id, p_customer_id, p_amount_paise, v_direction);

    SELECT COALESCE(SUM(pa.amount), 0) INTO v_allocated
    FROM payment_allocations pa
    WHERE pa.payment_id = v_payment_id;

    PERFORM log_audit_entry(
        v_profile_id, 'payment_made', 'payments', v_payment_id, NULL,
        jsonb_build_object('customer_id', p_customer_id, 'amount', p_amount_paise, 'method', p_method, 'reference', p_reference)
    );

    RETURN QUERY SELECT TRUE, v_payment_id, NULL, v_allocated;
END;
$$;


-- Update allocate_payment_to_schedules to accept a direction parameter
CREATE OR REPLACE FUNCTION allocate_payment_to_schedules(
    p_payment_id UUID,
    p_customer_id UUID,
    p_amount BIGINT,
    p_direction TEXT DEFAULT 'fifo'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    remaining_amount BIGINT := p_amount;
    schedule_rec RECORD;
    allocated_amount BIGINT;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM payments p
        WHERE p.id = p_payment_id AND p.customer_id = p_customer_id AND p.profile_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: payment does not belong to the current user';
    END IF;

    IF p_direction = 'lifo' THEN
        FOR schedule_rec IN
            SELECT id, due_amount, due_date
            FROM weekly_schedules
            WHERE customer_id = p_customer_id AND paid = FALSE AND due_amount > 0
            ORDER BY due_date DESC
        LOOP
            IF remaining_amount <= 0 THEN EXIT; END IF;
            allocated_amount := LEAST(remaining_amount, schedule_rec.due_amount);
            INSERT INTO payment_allocations (payment_id, schedule_id, amount)
            VALUES (p_payment_id, schedule_rec.id, allocated_amount);
            UPDATE weekly_schedules
            SET paid = (allocated_amount >= due_amount),
                payment_id = p_payment_id,
                updated_at = NOW()
            WHERE id = schedule_rec.id;
            remaining_amount := remaining_amount - allocated_amount;
        END LOOP;
    ELSE
        FOR schedule_rec IN
            SELECT id, due_amount, due_date
            FROM weekly_schedules
            WHERE customer_id = p_customer_id AND paid = FALSE AND due_amount > 0
            ORDER BY due_date ASC
        LOOP
            IF remaining_amount <= 0 THEN EXIT; END IF;
            allocated_amount := LEAST(remaining_amount, schedule_rec.due_amount);
            INSERT INTO payment_allocations (payment_id, schedule_id, amount)
            VALUES (p_payment_id, schedule_rec.id, allocated_amount);
            UPDATE weekly_schedules
            SET paid = (allocated_amount >= due_amount),
                payment_id = p_payment_id,
                updated_at = NOW()
            WHERE id = schedule_rec.id;
            remaining_amount := remaining_amount - allocated_amount;
        END LOOP;
    END IF;
END;
$$;
