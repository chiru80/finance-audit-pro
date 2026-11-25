-- Finance Audit Pro - Fix PL/pgSQL RETURN QUERY type casts in RPC functions
-- Fixes PostgreSQL 42804 ("structure of query does not match function result type")
-- caused by untyped NULL / integer 0 in RETURN QUERY SELECT statements.

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
