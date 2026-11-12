-- Finance Audit Pro - Grant Table & Routine Privileges to Authenticated Role
-- Migration: 202611110004_grant_permissions.sql
-- Date: 2026-11-12

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions to authenticated users (RLS policies govern row-level access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Future tables and routines default permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
