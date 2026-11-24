-- Finance Audit Pro - Security Hardening
-- Migration: 202611110006_security_hardening.sql
-- Date: 2026-11-17
--
-- Applies on top of 202611110005_auto_confirm_and_profile_trigger.sql.
-- Addresses the source-grounded leads recorded by the scoped security audit:
--   1. rpc.log_audit_entry.missing_auth.uid
--   2. rpc.allocate_payment_to_schedules.missing_owner_check
--   3. auth.open_signup.autoconfirm.settings_rls
--
-- POST-MIGRATION REQUIRED STEP (owner must do once, in Supabase SQL Editor):
--   Replace the placeholder email below with the real owner email and run:
--
--     INSERT INTO public.app_owners (email, user_id)
--     VALUES (
--       'owner@example.com',
--       (SELECT id FROM auth.users WHERE lower(email) = lower('owner@example.com'))
--     )
--     ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id;
--
--   The owner must also disable public signups in Supabase Dashboard
--   (Authentication -> Providers -> Email -> "Allow new users to sign up" = off)
--   or enforce email confirmation/invite-only onboarding. RLS is authoritative;
--   the dashboard setting stops arbitrary profile creation at the source.
--
-- Note: auth.uid() is NULL for trusted server-side contexts (no JWT), so the
-- guards below only constrain requests that carry a real authenticated JWT.
-- Internal SECURITY DEFINER callers therefore keep working after the REVOKEs.


-- ============================================================================
-- 1. Owner allowlist and owner-aware helper
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_owners (
    email TEXT PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- No policies are granted to anon/authenticated on purpose: only service_role
-- and SECURITY DEFINER helpers can read this table.
ALTER TABLE public.app_owners ENABLE ROW LEVEL SECURITY;

-- Returns true only for the provisioned owner. Callable by authenticated users
-- because it only answers a yes/no question about their own auth.uid().
CREATE OR REPLACE FUNCTION public.is_app_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.app_owners
        WHERE user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_app_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_owner() TO authenticated;


-- ============================================================================
-- 2. Settings RLS bound to the owner (replaces auth.role() = 'authenticated')
-- ============================================================================

DROP POLICY IF EXISTS "Owner can view settings" ON settings;
DROP POLICY IF EXISTS "Owner can create settings" ON settings;
DROP POLICY IF EXISTS "Owner can update settings" ON settings;
DROP POLICY IF EXISTS "Owner can delete settings" ON settings;

CREATE POLICY "Owner can view settings" ON settings
    FOR SELECT USING (public.is_app_owner());

CREATE POLICY "Owner can create settings" ON settings
    FOR INSERT WITH CHECK (public.is_app_owner());

CREATE POLICY "Owner can update settings" ON settings
    FOR UPDATE
    USING (public.is_app_owner())
    WITH CHECK (public.is_app_owner());

CREATE POLICY "Owner can delete settings" ON settings
    FOR DELETE USING (public.is_app_owner());


-- ============================================================================
-- 3. Auto-confirm only the provisioned owner; never auto-confirm strangers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- NEW.email is the only identity available BEFORE the auth.users insert.
    -- Platform-provided confirmation (e.g. OAuth or email link) is preserved.
    IF EXISTS (
        SELECT 1
        FROM public.app_owners
        WHERE lower(email) = lower(NEW.email)
    ) THEN
        NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    END IF;
    RETURN NEW;
END;
$$;


-- ============================================================================
-- 4. log_audit_entry: ownership guard (defense in depth)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_entry(
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
    IF auth.uid() IS NOT NULL AND p_profile_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Access denied: audit entry must belong to the current user';
    END IF;

    INSERT INTO audit_logs (
        profile_id, action, table_name, record_id, old_values, new_values,
        created_at
    ) VALUES (
        p_profile_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values, NOW()
    );
END;
$$;


-- ============================================================================
-- 5. allocate_payment_to_schedules: ownership guard (defense in depth)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.allocate_payment_to_schedules(
    p_payment_id UUID,
    p_customer_id UUID,
    p_amount BIGINT
)
RETURNS TABLE(allocation_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    remaining_amount BIGINT := p_amount;
    schedule_rec RECORD;
    allocated_amount BIGINT;
    payment_exists BOOLEAN;
BEGIN
    IF auth.uid() IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM payments p
        WHERE p.id = p_payment_id
          AND p.customer_id = p_customer_id
          AND p.profile_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: payment does not belong to the current user';
    END IF;

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
$$;


-- ============================================================================
-- 6. Remove direct PostgREST execution of internal privileged helpers
-- ============================================================================

REVOKE ALL ON FUNCTION public.log_audit_entry(UUID, TEXT, TEXT, UUID, JSONB, JSONB)
    FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.allocate_payment_to_schedules(UUID, UUID, BIGINT)
    FROM PUBLIC, anon, authenticated;
