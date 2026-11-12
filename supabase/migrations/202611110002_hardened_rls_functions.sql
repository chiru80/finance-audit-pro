-- Finance Aduit Pro - Hardened RLS and Additional Functions
-- Migration: 202611110002_hardened_rls_functions.sql
Date: 2026-11-11

-- This migration applies on top of 202611110001_initial_schema.sql
-- Fixes and enhancements:
-- 1. Fix payment allocation to use FIFO instead of LIFO
-- 2. Strengthen settings RLS policy
-- 3. Replace direct online_payments UPDATE with RPC function
-- 4. Add trigger for weekly_rate_history on profiles.weekly_due_amount change
-- 5. Add record_weekly_payment RPC function
-- 6. Add record_absence RPC function
-- 7. Add approve_absence RPC function
-- 8. Add function to generate weekly schedules for a customer

DROP FUNCTION IF EXISTS allocate_payment_to_schedules(UUID, UUID, BIGINT);
CREATE OR REPLACE FUNCTION allocate_payment_to_schedules(
    p_payment_id UUID,
    p_customer_id UUID,
    p_amount BIGINT
)
RETURNS TABLE(allocation_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$$$
DECLARE
    remaining_amount BIGINT := p_amount;
    schedule_rec RECORD;
    allocated_amount BIGINT;
    payment_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM payments
        WHERE id = p_payment_id
          AND customer_id = p_customer_id
          AND amount >= p_amount
    ) INTO payment_exists;

    IF NOT payment_exists THEN
        RAISE EXCEPTION 'Payment % does not belong to customer % or amount mismatch', p_payment_id, p_customer_id;
    END IF;

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

        allocated_amount := LEAST(remaining_amount, schedule_rec.due_amount);

        INSERT INTO payment_allocations (payment_id, schedule_id, amount)
        VALUES (p_payment_id, schedule_rec.id, allocated_amount);

        UPDATE weekly_schedules
        SET paid = TRUE,
            payment_id = p_payment_id,
            updated_at = NOW()
        WHERE id = schedule_rec.id
          AND due_amount <= remaining_amount;

        remaining_amount := remaining_amount - allocated_amount;
    END LOOP;

    RETURN QUERY SELECT (p_amount - remaining_amount)::INTEGER;
END;
$$$$ LANGUAGE plpgsql;


-- Fix: Settings RLS - Owner-bound policies (single-owner model:
-- the authenticated owner can access settings; no multi-tenant access)
DROP POLICY IF EXISTS "Owner can view settings" ON settings;
DROP POLICY IF EXISTS "Owner can create settings" ON settings;
DROP POLICY IF EXISTS "Owner can update settings" ON settings;
DROP POLICY IF EXISTS "Owner can delete settings" ON settings;

CREATE POLICY "Owner can view settings" ON settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can create settings" ON settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner can update settings" ON settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can delete settings" ON settings
    FOR DELETE USING (auth.role() = 'authenticated');


-- Enhancement: Online payments - RPC for status updates only
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
        RETURN QUERY SELECT FALSE, 'Payment not found or access denied';
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
$$ LANGUAGE plpgsql;


-- Enhancement: Weekly Rate History Trigger for profiles
CREATE OR REPLACE FUNCTION record_rate_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_rate BIGINT;
    v_new_rate BIGINT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.weekly_due_amount = NEW.weekly_due_amount THEN
        RETURN NEW;
    END IF;

    v_new_rate := NEW.weekly_due_amount;

    IF TG_OP = 'UPDATE' THEN
        v_current_rate := OLD.weekly_due_amount;
    ELSE
        v_current_rate := 0;
    END IF;

    IF v_current_rate = v_new_rate THEN
        RETURN NEW;
    END IF;

    UPDATE weekly_rate_history
    SET effective_to = CURRENT_DATE - INTERVAL '1 day'
    WHERE profile_id = NEW.id
      AND effective_to IS NULL;

    INSERT INTO weekly_rate_history (
        profile_id,
        rate,
        effective_from,
        effective_to,
        created_at
    ) VALUES (
        NEW.id,
        v_new_rate,
        CURRENT_DATE,
        NULL,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rate_change ON profiles;
CREATE TRIGGER trigger_rate_change
    AFTER UPDATE OR INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION record_rate_change();


-- RPC: Record Weekly Payment (FIFO allocation)
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

    INSERT INTO payments (
        customer_id,
        profile_id,
        amount,
        payment_method,
        reference,
        payment_date,
        notes,
        created_at
    ) VALUES (
        p_customer_id,
        v_profile_id,
        p_amount_paise,
        p_method,
        p_reference,
        CURRENT_DATE,
        p_notes,
        NOW()
    ) RETURNING id INTO v_payment_id;

    SELECT COALESCE(SUM(allocation_count), 0) INTO v_allocated
    FROM allocate_payment_to_schedules(v_payment_id, p_customer_id, p_amount_paise);

    PERFORM log_audit_entry(
        v_profile_id,
        'payment_made',
        'payments',
        v_payment_id,
        NULL,
        jsonb_build_object(
            'customer_id', p_customer_id,
            'amount', p_amount_paise,
            'method', p_method,
            'reference', p_reference
        )
    );

    RETURN QUERY SELECT TRUE, v_payment_id, NULL, v_allocated;
END;
$$ LANGUAGE plpgsql;


-- RPC: Record Absence
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
    v_absence_id UUID;
    v_customer_name TEXT;
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

    IF EXISTS (
        SELECT 1 FROM absences
        WHERE customer_id = p_customer_id
          AND week_start_date = p_week_start
          AND status IN ('pending', 'approved', 'rejected')
    ) THEN
        RETURN QUERY SELECT FALSE, NULL, 'Absence already recorded for this week';
        RETURN;
    END IF;

    INSERT INTO absences (
        id,
        customer_id,
        week_start_date,
        week_end_date,
        reason,
        status,
        created_at
    ) VALUES (
        uuid_generate_v4(),
        p_customer_id,
        p_week_start,
        p_week_start + INTERVAL '6 days',
        p_reason,
        'pending',
        NOW()
    ) RETURNING id INTO v_absence_id;

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
            'reason', p_reason
        )
    );

    RETURN QUERY SELECT TRUE, v_absence_id, NULL;
END;
$$ LANGUAGE plpgsql;


-- RPC: Approve Absence
CREATE OR REPLACE FUNCTION approve_absence(
    p_absence_id UUID,
    p_approve BOOLEAN
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
    v_customer_id UUID;
    v_customer_name TEXT;
    v_current_status TEXT;
BEGIN
    SELECT a.customer_id, a.status, c.profile_id, c.name
    INTO v_customer_id, v_current_status, v_profile_id, v_customer_name
    FROM absences a
    JOIN customers c ON a.customer_id = c.id
    WHERE a.id = p_absence_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL, 'Absence record not found';
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, NULL, 'Access denied';
        RETURN;
    END IF;

    IF v_current_status = 'pending' THEN
        UPDATE absences
        SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
            approved_by = auth.uid(),
            approved_at = NOW(),
            updated_at = NOW()
        WHERE id = p_absence_id;

        IF p_approve THEN
            UPDATE weekly_schedules
            SET absence_approved = TRUE,
                absence_recorded = TRUE,
                updated_at = NOW()
            WHERE customer_id = v_customer_id
              AND week_start_date = (
                  SELECT week_start_date FROM absences WHERE id = p_absence_id
              );
        END IF;

        PERFORM log_audit_entry(
            v_profile_id,
            CASE WHEN p_approve THEN 'absence_approved' ELSE 'absence_rejected' END,
            'absences',
            p_absence_id,
            NULL,
            jsonb_build_object(
                'customer_id', v_customer_id,
                'customer_name', v_customer_name,
                'status', v_current_status,
                'new_status', CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END
            )
        );

        RETURN QUERY SELECT TRUE, p_absence_id, NULL;
    ELSE
        RETURN QUERY SELECT FALSE, NULL, 'Absence is not in pending status';
        RETURN;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Function: Generate Weekly Schedules for Customer
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
BEGIN
    IF p_weeks_count < 1 OR p_weeks_count > 12 THEN
        RETURN QUERY SELECT FALSE, 0, 'weeks_count must be between 1 and 12';
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
                id,
                customer_id,
                week_start_date,
                week_end_date,
                due_date,
                due_amount,
                paid,
                payment_id,
                absence_recorded,
                absence_approved,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                p_customer_id,
                v_week_start,
                v_week_end,
                v_week_start,
                v_weekly_due_amount,
                FALSE,
                NULL,
                FALSE,
                NULL,
                NOW(),
                NOW()
            );
            v_created_count := v_created_count + 1;
        END IF;
    END LOOP;

    UPDATE customers
    SET total_due = (SELECT COALESCE(SUM(due_amount), 0) FROM weekly_schedules WHERE customer_id = p_customer_id),
        updated_at = NOW()
    WHERE id = p_customer_id;

    PERFORM log_audit_entry(
        v_profile_id,
        'schedules_generated',
        'weekly_schedules',
        NULL,
        NULL,
        jsonb_build_object(
            'customer_id', p_customer_id,
            'weeks_count', p_weeks_count,
            'schedules_created', v_created_count
        )
    );

    RETURN QUERY SELECT TRUE, v_created_count, NULL;
END;
$$ LANGUAGE plpgsql;


-- RPC: Get Customer Payment Summary
CREATE OR REPLACE FUNCTION get_customer_payment_summary(
    p_customer_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    outstanding_balance BIGINT,
    total_due BIGINT,
    total_paid BIGINT,
    next_due_date DATE,
    next_due_amount BIGINT,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    SELECT profile_id
    INTO v_profile_id
    FROM customers
    WHERE id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 0, 0, NULL, NULL, 'Customer not found';
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 0, 0, 0, NULL, NULL, 'Access denied';
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        TRUE,
        c.outstanding_balance,
        c.total_due,
        c.total_paid,
        (SELECT MIN(due_date) FROM weekly_schedules WHERE customer_id = p_customer_id AND paid = FALSE AND due_amount > 0),
        (SELECT due_amount FROM weekly_schedules WHERE customer_id = p_customer_id AND paid = FALSE AND due_amount > 0 ORDER BY due_date ASC LIMIT 1),
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;


-- Update the payment_allocation_direction setting to FIFO
UPDATE settings
SET value = 'forward'
WHERE key = 'payment_allocation_direction';


-- Comments for Documentation
COMMENT ON FUNCTION record_weekly_payment(UUID, BIGINT, TEXT, TEXT, TEXT) IS 'Atomic payment recording with FIFO allocation to unpaid schedules';
COMMENT ON FUNCTION record_absence(UUID, DATE, TEXT) IS 'Record a customer absence for a specific week (status: pending)';
COMMENT ON FUNCTION approve_absence(UUID, BOOLEAN) IS 'Approve or reject an absence record';
COMMENT ON FUNCTION generate_weekly_schedules(UUID, INTEGER) IS 'Generate weekly schedules for a customer for the next N weeks';
COMMENT ON FUNCTION update_online_payment_status(UUID, TEXT, TIMESTAMP) IS 'Update online payment status (replaces direct UPDATE)';
COMMENT ON FUNCTION get_customer_payment_summary(UUID) IS 'Get customer payment summary with next due information';
