-- Migration: WhatsApp (OpenWA) report delivery
-- Adds a single-owner settings namespace for the OpenWA gateway connection,
-- plus a lightweight audit trail for every report that was sent over WhatsApp.
--
-- The OpenWA API key and gateway base URL are stored server-side only. The
-- browser never receives the key: the `whatsapp-send-report` edge function
-- reads these rows and signs requests with the `X-API-Key` header itself.
-- RLS keeps the rows visible to the app owner only (fail closed for everyone
-- else), matching the existing `settings` table policy.

-- 1. Gateway connection config (one row, keyed by constant).
-- The `id = true` CHECK plus the single-row upsert in the edge function keep
-- exactly one config row; no trigger helper is needed.
CREATE TABLE IF NOT EXISTS app_whatsapp_config (
    id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
    base_url text NOT NULL,
    api_key text NOT NULL,
    session_name text NOT NULL DEFAULT 'finance-audit-pro',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Per-report send audit trail (append-only via the edge function).
CREATE TABLE IF NOT EXISTS whatsapp_report_sends (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_phone text NOT NULL,
    recipient_name text,
    report_type text NOT NULL,        -- 'payments' | 'balances' | 'summary'
    message_id text,
    delivered boolean NOT NULL DEFAULT false,
    error text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_report_sends_profile
    ON whatsapp_report_sends(profile_id, created_at DESC);

-- 3. RLS: owner-only visibility, matching the hardened `settings` policy.
ALTER TABLE app_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_report_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can view whatsapp config" ON app_whatsapp_config;
CREATE POLICY "Owner can view whatsapp config" ON app_whatsapp_config
    FOR SELECT USING (public.is_app_owner());

DROP POLICY IF EXISTS "Owner can manage whatsapp config" ON app_whatsapp_config;
CREATE POLICY "Owner can manage whatsapp config" ON app_whatsapp_config
    FOR ALL USING (public.is_app_owner())
    WITH CHECK (public.is_app_owner());

DROP POLICY IF EXISTS "Owner can view whatsapp report sends" ON whatsapp_report_sends;
CREATE POLICY "Owner can view whatsapp report sends" ON whatsapp_report_sends
    FOR SELECT USING (public.is_app_owner());

-- The edge function inserts rows using the service-role key, which bypasses
-- RLS by design. No client-side insert policy is granted on purpose.

-- 4. Seed a disabled-by-default row so the UI has something to edit. The
--    `base_url` and `api_key` are placeholders; the owner fills them in.
INSERT INTO app_whatsapp_config (id, base_url, api_key, session_name)
VALUES (true, '', '', 'finance-audit-pro')
ON CONFLICT (id) DO NOTHING;