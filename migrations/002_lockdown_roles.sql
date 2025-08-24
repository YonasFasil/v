-- Migration: Database Role Security Hardening
-- Purpose: Implement least-privilege database roles for tenant isolation security
-- 
-- Creates separate owner and application roles:
-- - venuine_owner: Owns tables, runs migrations, has full schema control
-- - venuine_app: Limited application role with NOSUPERUSER NOBYPASSRLS
--
-- Security Impact:
-- - Prevents application from bypassing Row Level Security (RLS)
-- - Limits privilege escalation if application is compromised
-- - Enforces database-level tenant isolation guarantees

BEGIN;

-- Create the owner role for migrations and schema management
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'venuine_owner') THEN
    CREATE ROLE venuine_owner WITH
      LOGIN
      NOSUPERUSER
      CREATEDB
      CREATEROLE
      INHERIT
      NOREPLICATION
      CONNECTION LIMIT -1
      PASSWORD 'venuine_owner_secure_password_2024!';
    
    RAISE NOTICE 'Created venuine_owner role';
  ELSE
    RAISE NOTICE 'venuine_owner role already exists';
  END IF;
END
$$;

-- Create the restricted application role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'venuine_app') THEN
    CREATE ROLE venuine_app WITH
      LOGIN
      NOSUPERUSER          -- Cannot bypass security
      NOBYPASSRLS          -- Cannot bypass Row Level Security
      NOCREATEDB           -- Cannot create databases
      NOCREATEROLE         -- Cannot create roles
      INHERIT              -- Inherits permissions from roles it's a member of
      NOREPLICATION        -- Cannot initiate replication
      CONNECTION LIMIT 10  -- Limit concurrent connections
      PASSWORD 'venuine_app_secure_password_2024!';
    
    RAISE NOTICE 'Created venuine_app role';
  ELSE
    -- Update existing role to ensure security flags are correct
    ALTER ROLE venuine_app WITH
      NOSUPERUSER
      NOBYPASSRLS
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION;
    
    RAISE NOTICE 'Updated venuine_app role security flags';
  END IF;
END
$$;

-- Transfer table ownership to venuine_owner role
-- This ensures the application role doesn't own the tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO venuine_owner', table_record.tablename);
    RAISE NOTICE 'Changed owner of table % to venuine_owner', table_record.tablename;
  END LOOP;
END
$$;

-- Transfer sequence ownership to venuine_owner role
DO $$
DECLARE
  seq_record RECORD;
BEGIN
  FOR seq_record IN 
    SELECT sequencename 
    FROM pg_sequences 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO venuine_owner', seq_record.sequencename);
    RAISE NOTICE 'Changed owner of sequence % to venuine_owner', seq_record.sequencename;
  END LOOP;
END
$$;

-- Revoke default PUBLIC privileges on schema
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Grant minimal schema access to application role
GRANT USAGE ON SCHEMA public TO venuine_app;

-- Grant table permissions to application role
-- Only grant permissions needed for application functionality
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO venuine_app;

-- Grant sequence permissions for auto-generated IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO venuine_app;

-- Grant permissions on future tables and sequences
-- This ensures new tables created by migrations get proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO venuine_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO venuine_app;

-- Grant minimal function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO venuine_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO venuine_app;

-- Create a view to monitor role security status
CREATE OR REPLACE VIEW security_role_status AS
SELECT 
  rolname,
  rolsuper as is_superuser,
  rolbypassrls as can_bypass_rls,
  rolcreatedb as can_create_db,
  rolcreaterole as can_create_role,
  rolreplication as can_replicate,
  rolconnlimit as connection_limit,
  CASE 
    WHEN rolname = 'venuine_app' AND NOT rolsuper AND NOT rolbypassrls THEN '✅ SECURE'
    WHEN rolname = 'venuine_owner' AND NOT rolsuper THEN '✅ SECURE'
    ELSE '❌ INSECURE'
  END as security_status
FROM pg_roles 
WHERE rolname IN ('venuine_app', 'venuine_owner', 'postgres')
ORDER BY rolname;

-- Grant view access to both roles for monitoring
GRANT SELECT ON security_role_status TO venuine_app;
GRANT SELECT ON security_role_status TO venuine_owner;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 DATABASE ROLE SECURITY HARDENING COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ venuine_owner: Schema owner, runs migrations';
  RAISE NOTICE '✅ venuine_app: Restricted app role (NOSUPERUSER, NOBYPASSRLS)';
  RAISE NOTICE '✅ PUBLIC privileges revoked';
  RAISE NOTICE '✅ Minimal CRUD permissions granted to app role';
  RAISE NOTICE '✅ Table ownership transferred to owner role';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Update connection strings to use venuine_app role';
  RAISE NOTICE '⚠️  Production: Use venuine_app for application connections';
  RAISE NOTICE '⚠️  Migrations: Use venuine_owner for schema changes';
  RAISE NOTICE '';
END
$$;

COMMIT;