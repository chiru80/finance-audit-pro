-- Finance Audit Pro - Ensure amount_given column exists on customers
-- Fixes PGRST204 ("Could not find the 'amount_given' column of 'customers' in the schema cache")
-- when 202611180002 was applied prior to adding amount_given to the SQL file.

ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS amount_given BIGINT NOT NULL DEFAULT 0;

-- Refresh PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
