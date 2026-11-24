-- Finance Audit Pro - Reversals, Settings Enforcement & Immutability
-- Migration: 202611110008_reversals_and_settings.sql
-- Date: 2026-11-18

-- ============================================================================
-- 1. Exclude reversed payments from balance recomputation
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
-- 2. Reversal RPC for posted payments
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
        jsonb_build_object('reason', p_reason)
    );

    RETURN QUERY SELECT TRUE, NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION reverse_payment(UUID, TEXT) TO authenticated;


-- ============================================================================
-- 3. Make posted payments immutable at the DB level
-- ============================================================================

DROP POLICY IF EXISTS "Owner can update own payments" ON payments;
CREATE POLICY "Owner cannot update posted payments" ON payments
    FOR UPDATE USING (FALSE);

DROP POLICY IF EXISTS "Owner can delete own payments" ON payments;


-- ============================================================================
-- 4. Enforce absence_requires_approval setting in record_absence
-- ============================================================================

CREATE OR REPLACE FUNCTION record_absence(
    p_customer_id UUID,
    p_week_start DATE,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    absence_id UUID,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_customer_name TEXT;
    v_absence_id UUID;
    v_requires_approval BOOLEAN := TRUE;
    v_initial_status TEXT := 'pending';
BEGIN
    SELECT c.profile_id, c.name
    INTO v_profile_id, v_customer_name
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL, 'Customer not found';
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, NULL, 'Access denied';
        RETURN;
    END IF;

    SELECT COALESCE((SELECT value FROM settings WHERE key = 'absence_requires_approval'), 'true') = 'true'
    INTO v_requires_approval;

    IF NOT v_requires_approval THEN
        v_initial_status := 'approved';
    END IF;

    IF EXISTS (
        SELECT 1 FROM absences
        WHERE customer_id = p_customer_id
          AND week_start_date = p_week_start
          AND status IN ('pending', 'approved')
    ) THEN
        RETURN QUERY SELECT FALSE, NULL, 'Absence already recorded for this week';
        RETURN;
    END IF;

    INSERT INTO absences (
        customer_id, profile_id, week_start_date, week_end_date, reason, status, approved_by, approved_at
    ) VALUES (
        p_customer_id,
        v_profile_id,
        p_week_start,
        p_week_start + INTERVAL '6 days',
        p_reason,
        v_initial_status,
        CASE WHEN v_initial_status = 'approved' THEN auth.uid() ELSE NULL END,
        CASE WHEN v_initial_status = 'approved' THEN NOW() ELSE NULL END
    ) RETURNING id INTO v_absence_id;

    IF v_initial_status = 'approved' THEN
        UPDATE weekly_schedules
        SET absence_recorded = TRUE,
            absence_approved = TRUE,
            updated_at = NOW()
        WHERE customer_id = p_customer_id
          AND week_start_date = p_week_start;
    END IF;

    PERFORM log_audit_entry(
        v_profile_id,
        'absence_recorded',
        'absences',
        v_absence_id,
        NULL,
        jsonb_build_object(
            'customer_id', p_customer_id,
            'customer_name', v_customer_name,
            'week_start', p_week_start,
            'reason', p_reason,
            'status', v_initial_status
        )
    );

    RETURN QUERY SELECT TRUE, v_absence_id, NULL;
END;
$$;


-- ============================================================================
-- 5. Enforce weekly_payments_start setting in generate_weekly_schedules
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_weekly_schedules(
    p_customer_id UUID,
    p_weeks_count INTEGER DEFAULT 4
)
RETURNS TABLE(
    success BOOLEAN,
    schedules_created INTEGER,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_weekly_due_amount BIGINT;
    v_created_count INTEGER := 0;
    v_existing_count INTEGER := 0;
    v_schedule_date DATE;
    v_week_start DATE;
    v_week_end DATE;
    i INTEGER;
    v_enabled BOOLEAN := TRUE;
BEGIN
    IF p_weeks_count < 1 OR p_weeks_count > 12 THEN
        RETURN QUERY SELECT FALSE, 0, 'weeks_count must be between 1 and 12';
        RETURN;
    END IF;

    SELECT COALESCE((SELECT value FROM settings WHERE key = 'weekly_payments_start'), 'true') = 'true'
    INTO v_enabled;

    IF NOT v_enabled THEN
        RETURN QUERY SELECT FALSE, 0, 'Weekly payments are disabled in settings';
        RETURN;
    END IF;

    SELECT c.profile_id, c.weekly_due_amount
    INTO v_profile_id, v_weekly_due_amount
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 'Customer not found';
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 0, 'Access denied';
        RETURN;
    END IF;

    IF v_weekly_due_amount IS NULL THEN
        SELECT weekly_due_amount INTO v_weekly_due_amount
        FROM profiles
        WHERE id = v_profile_id;
    END IF;

    v_schedule_date := CURRENT_DATE;
    IF EXTRACT(DOW FROM v_schedule_date) <> 1 THEN
        v_schedule_date := v_schedule_date + INTERVAL '1 day' +
                          ((7 - EXTRACT(DOW FROM v_schedule_date))::INTEGER % 7) * INTERVAL '1 day';
    END IF;

    FOR i IN 1..p_weeks_count LOOP
        v_week_start := v_schedule_date + (i - 1) * INTERVAL '7 days';
        v_week_end := v_week_start + INTERVAL '6 days';

        SELECT COUNT(*) INTO v_existing_count
        FROM weekly_schedules
        WHERE customer_id = p_customer_id
          AND week_start_date = v_week_start;

        IF v_existing_count = 0 THEN
            INSERT INTO weekly_schedules (
                customer_id, week_start_date, week_end_date, due_date, due_amount, paid,
                payment_id, absence_recorded, absence_approved, created_at, updated_at
            ) VALUES (
                p_customer_id, v_week_start, v_week_end, v_week_start, v_weekly_due_amount, FALSE,
                NULL, FALSE, NULL, NOW(), NOW()
            );
            v_created_count := v_created_count + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT TRUE, v_created_count, NULL;
END;
$$;
