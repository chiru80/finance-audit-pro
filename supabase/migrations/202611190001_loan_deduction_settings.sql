-- Finance Audit Pro - Loan Deduction (Upfront Fee) Settings
-- Migration: 202611190001_loan_deduction_settings.sql
-- Date: 2026-11-19
--
-- Business rule (from owner):
--   The customer does NOT receive the full loan amount. A fixed deduction is
--   taken up front before the cash is handed over, e.g. deduct Rs 20 per
--   Rs 1000 given -> customer receives Rs 980.
--   The admin selects the deduction rate in Settings from a dropdown:
--     Full amount (no deduction) | Rs 10 | Rs 20 | Rs 30 | Rs 50  (per Rs 1000)
--   The customer form then auto-loads:
--     amount_given = loan_amount - loan_amount * (deduction_per_1000 / 1000)
--
-- This migration adds the settings rows and a helper SQL function so the same
-- rule can be enforced/reused server-side.

-- ============================================================================
-- 1. Settings rows
-- ============================================================================

INSERT INTO settings (key, value, description) VALUES
    ('loan_deduction_mode', 'fixed_per_1000',
     'How the upfront deduction is computed: fixed_per_1000 = flat Rs X deducted per Rs 1000 of loan'),
    ('loan_deduction_per_1000', '0',
     'Deduction in rupees per Rs 1000 of loan amount. Allowed: 0 (full amount), 10, 20, 30, 50. Default 0 = customer receives the full loan amount.')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- 2. Helper function: compute amount actually given to the customer
-- ============================================================================
-- Returns the net disbursal in paise after applying the deduction:
--   net_paise = loan_paise - round(loan_paise * deduction_per_1000 / 1000)
-- A deduction of 0 returns the full loan amount unchanged.

CREATE OR REPLACE FUNCTION calculate_amount_given(
    p_loan_amount_paise BIGINT,
    p_deduction_per_1000 INTEGER DEFAULT 0
)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    IF p_loan_amount_paise IS NULL OR p_loan_amount_paise <= 0 THEN
        RETURN 0;
    END IF;

    IF p_deduction_per_1000 IS NULL OR p_deduction_per_1000 <= 0 THEN
        RETURN p_loan_amount_paise; -- full amount, no deduction
    END IF;

    RETURN p_loan_amount_paise
           - ROUND(p_loan_amount_paise::NUMERIC * p_deduction_per_1000 / 1000.0)::BIGINT;
END;
$$;

COMMENT ON FUNCTION calculate_amount_given(BIGINT, INTEGER) IS
    'Returns the net amount handed to the customer (paise) after the upfront per-1000 deduction is removed';
