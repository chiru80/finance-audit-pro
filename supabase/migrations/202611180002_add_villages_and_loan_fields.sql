-- Finance Audit Pro - Add Villages Table and Loan Fields to Customers
-- Migration: 202611180001_add_villages_and_loan_fields.sql
-- Date: 2026-11-18
--
-- Adds:
-- 1. villages table (profile-scoped master list for village dropdown)
-- 2. village_id, loan_amount, total_weeks columns to customers table
-- 3. Updated generate_weekly_schedules function to support up to 52 weeks

-- ============================================================================
-- 1. Villages Table
-- ============================================================================

CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_village_per_profile UNIQUE (profile_id, name)
);

CREATE INDEX idx_villages_profile_id ON villages(profile_id);
CREATE INDEX idx_villages_is_active ON villages(is_active);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_villages_updated_at
    BEFORE UPDATE ON villages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. Add Loan Fields to Customers Table
-- ============================================================================

ALTER TABLE customers ADD COLUMN village_id UUID REFERENCES villages(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN loan_amount BIGINT NOT NULL DEFAULT 0; -- in paise
ALTER TABLE customers ADD COLUMN total_weeks INTEGER NOT NULL DEFAULT 12; -- 12, 21, 25, or custom up to 52
ALTER TABLE customers ADD COLUMN amount_given BIGINT NOT NULL DEFAULT 0; -- in paise, loan_amount minus deduction

CREATE INDEX idx_customers_village_id ON customers(village_id);

-- ============================================================================
-- 3. Updated generate_weekly_schedules Function
-- ============================================================================
-- Supports up to 52 weeks, uses customer's total_weeks if p_weeks_count not provided

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
    -- Use provided weeks_count, or fetch from customer, or default to 12
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

    -- Validate weeks range (1-52)
    IF v_total_weeks < 1 OR v_total_weeks > 52 THEN
        RETURN QUERY SELECT FALSE, 0, 'total_weeks must be between 1 and 52';
        RETURN;
    END IF;

    -- Check if weekly payments are enabled
    SELECT COALESCE((SELECT value FROM settings WHERE key = 'weekly_payments_start'), 'true') = 'true'
    INTO v_enabled;

    IF NOT v_enabled THEN
        RETURN QUERY SELECT FALSE, 0, 'Weekly payments are disabled in settings';
        RETURN;
    END IF;

    -- Get customer profile and weekly due amount
    SELECT c.profile_id, c.weekly_due_amount
    INTO v_profile_id, v_weekly_due_amount
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 'Customer not found';
        RETURN;
    END IF;

    -- Security: verify ownership
    IF v_profile_id <> auth.uid() THEN
        RETURN QUERY SELECT FALSE, 0, 'Access denied';
        RETURN;
    END IF;

    -- Fallback to profile default if customer weekly_due_amount is NULL
    IF v_weekly_due_amount IS NULL THEN
        SELECT weekly_due_amount INTO v_weekly_due_amount
        FROM profiles
        WHERE id = v_profile_id;
    END IF;

    -- Calculate next Monday as first week start
    v_schedule_date := CURRENT_DATE;
    IF EXTRACT(DOW FROM v_schedule_date) <> 1 THEN
        v_schedule_date := v_schedule_date + INTERVAL '1 day' +
                          ((7 - EXTRACT(DOW FROM v_schedule_date))::INTEGER % 7) * INTERVAL '1 day';
    END IF;

    -- Create schedules for v_total_weeks weeks
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

    RETURN QUERY SELECT TRUE, v_created_count, NULL;
END;
$$;

-- ============================================================================
-- 4. RLS Policies for Villages
-- ============================================================================

ALTER TABLE villages ENABLE ROW LEVEL SECURITY;

-- Owner can view their own villages
CREATE POLICY "Owner can view own villages" ON villages
    FOR SELECT
    USING (profile_id = auth.uid());

-- Owner can insert their own villages
CREATE POLICY "Owner can insert own villages" ON villages
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Owner can update their own villages
CREATE POLICY "Owner can update own villages" ON villages
    FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Owner can delete their own villages
CREATE POLICY "Owner can delete own villages" ON villages
    FOR DELETE
    USING (profile_id = auth.uid());