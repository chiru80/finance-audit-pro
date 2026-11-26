-- Finance Audit Pro - Fix PL/pgSQL RETURN QUERY type casts & payment reconciliation RPCs
-- Fixes PostgreSQL 42804 ("structure of query does not match function result type")
-- caused by untyped NULL / integer 0 in RETURN QUERY SELECT statements, and fixes
-- update_online_payment_status matching op.id as well as op.payment_id.

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
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be greater than 0'::TEXT, 0::BIGINT;
        RETURN;
    END IF;

    IF p_method NOT IN ('cash', 'online', 'cheque', 'other') THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid payment method'::TEXT, 0::BIGINT;
        RETURN;
    END IF;

    SELECT c.profile_id
    INTO v_profile_id
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Customer not found'::TEXT, 0::BIGINT;
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Access denied - customer does not belong to you'::TEXT, 0::BIGINT;
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
            RETURN QUERY SELECT FALSE, NULL::UUID, 'Partial payments are disabled; amount must cover the oldest unpaid week'::TEXT, 0::BIGINT;
            RETURN;
        END IF;
    END IF;

    INSERT INTO payments (
        customer_id, profile_id, amount, payment_method, reference, payment_date, notes, created_at
    ) VALUES (
        p_customer_id, v_profile_id, p_amount_paise, p_method, p_reference, CURRENT_DATE, p_notes, NOW()
    ) RETURNING id INTO v_payment_id;

    PERFORM allocate_payment_to_schedules(p_payment_id, p_customer_id, p_amount_paise, v_direction);

    SELECT COALESCE(SUM(pa.amount), 0)::BIGINT INTO v_allocated
    FROM payment_allocations pa
    WHERE pa.payment_id = v_payment_id;

    PERFORM log_audit_entry(
        v_profile_id, 'payment_made', 'payments', v_payment_id, NULL,
        jsonb_build_object('customer_id', p_customer_id, 'amount', p_amount_paise, 'method', p_method, 'reference', p_reference)
    );

    RETURN QUERY SELECT TRUE, v_payment_id, NULL::TEXT, COALESCE(v_allocated, 0::BIGINT);
END;
$$;

CREATE OR REPLACE FUNCTION generate_weekly_schedules(
    p_customer_id UUID,
    p_weeks_count INTEGER DEFAULT NULL
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
    v_total_weeks INTEGER;
BEGIN
    IF p_weeks_count IS NOT NULL THEN
        v_total_weeks := p_weeks_count;
    ELSE
        SELECT total_weeks INTO v_total_weeks
        FROM customers
        WHERE id = p_customer_id;

        IF v_total_weeks IS NULL THEN
            v_total_weeks := 12;
        END IF;
    END IF;

    IF v_total_weeks < 1 OR v_total_weeks > 52 THEN
        RETURN QUERY SELECT FALSE, 0, 'total_weeks must be between 1 and 52'::TEXT;
        RETURN;
    END IF;

    SELECT COALESCE((SELECT value FROM settings WHERE key = 'weekly_payments_start'), 'true') = 'true'
    INTO v_enabled;

    IF NOT v_enabled THEN
        RETURN QUERY SELECT FALSE, 0, 'Weekly payments are disabled in settings'::TEXT;
        RETURN;
    END IF;

    SELECT c.profile_id, c.weekly_due_amount
    INTO v_profile_id, v_weekly_due_amount
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 'Customer not found'::TEXT;
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 0, 'Access denied'::TEXT;
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

    FOR i IN 1..v_total_weeks LOOP
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

    RETURN QUERY SELECT TRUE, v_created_count, NULL::TEXT;
END;
$$;

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
        RETURN QUERY SELECT FALSE, 'A reversal reason is required'::TEXT;
        RETURN;
    END IF;

    SELECT p.profile_id, p.customer_id
    INTO v_profile_id, v_customer_id
    FROM payments p
    WHERE p.id = p_payment_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Payment not found'::TEXT;
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 'Access denied'::TEXT;
        RETURN;
    END IF;

    SELECT COALESCE(ph.reversed, FALSE) INTO v_already_reversed
    FROM payment_history ph
    WHERE ph.original_payment_id = p_payment_id;

    IF v_already_reversed THEN
        RETURN QUERY SELECT FALSE, 'Payment is already reversed'::TEXT;
        RETURN;
    END IF;

    UPDATE weekly_schedules
    SET paid = FALSE,
        payment_id = NULL,
        updated_at = NOW()
    WHERE customer_id = v_customer_id
      AND payment_id = p_payment_id
      AND paid = TRUE;

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

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

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
    v_online_id UUID;
    v_profile_id UUID;
BEGIN
    IF p_new_status NOT IN ('pending', 'completed', 'failed', 'refunded') THEN
        RETURN QUERY SELECT FALSE, 'Invalid status: must be pending, completed, failed, or refunded'::TEXT;
        RETURN;
    END IF;

    SELECT op.id, c.profile_id
    INTO v_online_id, v_profile_id
    FROM online_payments op
    JOIN customers c ON op.customer_id = c.id
    WHERE op.id = p_payment_id OR op.payment_id = p_payment_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Online payment record not found'::TEXT;
        RETURN;
    END IF;

    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 'Access denied'::TEXT;
        RETURN;
    END IF;

    UPDATE online_payments
    SET status = p_new_status,
        paid_at = COALESCE(p_paid_at, NOW()),
        updated_at = NOW()
    WHERE id = v_online_id;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;
