-- ============================================================================
-- Finance Audit Pro - Migration Runner Script (0007 → 0008 → 0009)
-- ============================================================================
-- Run this in the Supabase SQL Editor to apply the pending migrations.
-- The migrations must be applied in this exact order because:
--   - 0007 fixes critical trigger bugs (ambiguous column references)
--   - 0008 adds reversal-aware balance computation and settings enforcement
--   - 0009 adds partial payment enforcement and allocation direction support
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: Apply Migration 0007 - Fix Critical Bugs & Triggers
-- ----------------------------------------------------------------------------
\i 'supabase/migrations/202611110007_fix_critical_bugs.sql'

-- ----------------------------------------------------------------------------
-- Step 2: Apply Migration 0008 - Reversals, Settings Enforcement & Immutability
-- ----------------------------------------------------------------------------
\i 'supabase/migrations/202611110008_reversals_and_settings.sql'

-- ----------------------------------------------------------------------------
-- Step 3: Apply Migration 0009 - Partial Payments & Allocation Direction
-- ----------------------------------------------------------------------------
\i 'supabase/migrations/202611110009_partial_and_direction.sql'

-- ============================================================================
-- POST-MIGRATION: Provision the Owner
-- ============================================================================
-- Replace 'OWNER_EMAIL_HERE' with the actual owner email before running.
-- The owner must already exist in auth.users (created via signup).
--
-- INSERT INTO public.app_owners (email, user_id)
-- VALUES (
--   'OWNER_EMAIL_HERE',
--   (SELECT id FROM auth.users WHERE lower(email) = lower('OWNER_EMAIL_HERE'))
-- )
-- ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id;
--
-- Also verify:
--   SELECT is_app_owner();  -- should return true for the owner
-- ============================================================================