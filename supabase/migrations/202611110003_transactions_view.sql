-- Finance Aduit Pro - Transactions View
-- Migration: 202611110003_transactions_view.sql
-- Date: 2026-11-11
--
-- This migration creates a unified transactions view for the dashboard
-- that combines payments and payment_history for display purposes.
-- This is a VIEW (not a table) so it doesn't duplicate data.

-- Create transactions view for dashboard queries
-- security_invoker = true ensures RLS policies on underlying tables are enforced
-- when the view is queried by any authenticated user.
CREATE OR REPLACE VIEW transactions
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.customer_id,
    c.name AS customer_name,
    p.amount,
    p.payment_date AS date,
    CASE
        WHEN p.payment_method = 'cash' THEN 'collection'
        WHEN p.payment_method = 'online' THEN 'collection'
        WHEN p.payment_method = 'cheque' THEN 'collection'
        ELSE 'payment'
    END AS type,
    CASE
        WHEN p.payment_method = 'online' AND EXISTS (
            SELECT 1 FROM online_payments op
            WHERE op.payment_id = p.id AND op.status = 'completed'
        ) THEN 'paid'
        WHEN p.payment_method != 'online' THEN 'paid'
        ELSE 'pending'
    END AS status,
    p.reference AS description
FROM payments p
JOIN customers c ON c.id = p.customer_id
WHERE p.id IS NOT NULL

UNION ALL

SELECT
    ph.id,
    ph.customer_id,
    c.name AS customer_name,
    ph.amount,
    ph.payment_date AS date,
    CASE
        WHEN ph.payment_method = 'cash' THEN 'collection'
        WHEN ph.payment_method = 'online' THEN 'collection'
        WHEN ph.payment_method = 'cheque' THEN 'collection'
        ELSE 'payment'
    END AS type,
    CASE
        WHEN ph.reversed THEN 'pending'
        ELSE 'paid'
    END AS status,
    ph.reference AS description
FROM payment_history ph
JOIN customers c ON c.id = ph.customer_id
WHERE ph.reversed = FALSE

ORDER BY date DESC, id DESC;

-- Grant select on the view to authenticated users
-- RLS is automatically enforced on the underlying tables via WITH (security_invoker = true)
GRANT SELECT ON transactions TO authenticated;

-- Index on the underlying tables already exists for performance
-- Create a covering index on payments for this view
CREATE INDEX IF NOT EXISTS idx_payments_dashboard
    ON payments (payment_date DESC, customer_id, id)
    INCLUDE (amount, payment_method, reference);

CREATE INDEX IF NOT EXISTS idx_payment_history_dashboard
    ON payment_history (payment_date DESC, customer_id, id)
    INCLUDE (amount, payment_method, reference, reversed);

-- Comment for documentation
COMMENT ON VIEW transactions IS 'Unified transactions view combining payments and payment_history for dashboard display. RLS enforced via security_invoker and owner-scoped policy.';