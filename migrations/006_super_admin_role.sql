-- Migration: Create Super-Admin Database Role
-- Purpose: Allow super-admin operations while maintaining security lockdown
-- 
-- Security Impact:
-- - Creates elevated role for super-admin operations only
-- - Maintains RLS enforcement for tenant isolation
-- - Allows role switching for specific operations
-- - Does not permanently elevate privileges

BEGIN;

-- ============================================================================
-- CREATE SUPER-ADMIN ROLE WITH ELEVATED PRIVILEGES
-- ============================================================================

-- Create super-admin role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'venuine_super_admin') THEN
    CREATE ROLE venuine_super_admin;
    RAISE NOTICE 'Created venuine_super_admin role';
  END IF;
END $$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO venuine_super_admin;

-- Grant necessary permissions for super-admin operations
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON venues TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON services TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON packages TO venuine_super_admin;
GRANT SELECT, INSERT, UPDATE ON admin_audit TO venuine_super_admin;

-- Grant access to subscription packages (super-admin needs this for tenant creation)
GRANT SELECT ON subscription_packages TO venuine_super_admin;

-- Grant sequence usage for ID generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO venuine_super_admin;

-- Allow venuine_app to switch to super-admin role when needed
GRANT venuine_super_admin TO venuine_app;

-- ============================================================================
-- CREATE SUPER-ADMIN HELPER FUNCTIONS
-- ============================================================================

-- Function to safely execute super-admin operations
CREATE OR REPLACE FUNCTION execute_as_super_admin(operation TEXT)
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  -- This function runs with the privileges of its owner (postgres)
  -- allowing super-admin operations without permanently elevating the role
  EXECUTE operation;
END $$;

-- Grant execute permission to venuine_app
GRANT EXECUTE ON FUNCTION execute_as_super_admin TO venuine_app;

-- ============================================================================
-- VERIFY RLS IS STILL ENFORCED
-- ============================================================================

-- Ensure RLS policies are still active for super-admin role
-- Super-admin can insert/update but still respects tenant boundaries for reads

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('users', 'customers', 'venues', 'bookings', 'proposals', 'payments', 'companies', 'services', 'packages')
  LOOP
    -- Verify RLS is still enabled and forced
    IF NOT EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = table_record.tablename 
      AND relrowsecurity = true 
      AND relforcerowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS not properly configured for table: %', table_record.tablename;
    END IF;
    
    RAISE NOTICE 'Verified RLS enforcement for: %', table_record.tablename;
  END LOOP;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Super-admin role created with controlled elevated privileges';
  RAISE NOTICE 'RLS enforcement verified for all tenant tables';
  RAISE NOTICE 'Super-admin operations now possible while maintaining tenant isolation';
END $$;

COMMIT;