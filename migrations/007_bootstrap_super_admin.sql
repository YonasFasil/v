-- 007_bootstrap_super_admin.sql
-- Purpose: Bootstrap initial super admin user after database reset
-- MUST be run as database owner (postgres), not app role
-- Uses environment variables from .env file

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ensure users table allows NULL tenant_id for super_admins only
ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL;

-- Add constraint to ensure only super_admins can have NULL tenant_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_tenant_null_only_for_super_admin'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_tenant_null_only_for_super_admin
      CHECK (
        (tenant_id IS NULL AND role = 'super_admin')
        OR (tenant_id IS NOT NULL)
      );
    RAISE NOTICE 'Added constraint: users_tenant_null_only_for_super_admin';
  ELSE
    RAISE NOTICE 'Constraint users_tenant_null_only_for_super_admin already exists';
  END IF;
END $$;

-- 2) Idempotent upsert of super admin user
-- Uses environment variables: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
WITH existing_user AS (
  UPDATE users
  SET 
    role = 'super_admin',
    tenant_id = NULL,
    is_active = true,
    username = 'superadmin',
    name = 'Super Administrator'
  WHERE lower(email) = lower('admin@yourdomain.com')
  RETURNING id, email
),
new_user AS (
  INSERT INTO users (
    id, 
    username, 
    email, 
    name, 
    role, 
    tenant_id, 
    password_hash, 
    is_active, 
    created_at, 
    updated_at
  )
  SELECT 
    gen_random_uuid(),
    'superadmin',
    'admin@yourdomain.com',
    'Super Administrator',
    'super_admin',
    NULL,
    crypt('VenueAdmin2024!', gen_salt('bf', 12)),
    true,
    now(),
    now()
  WHERE NOT EXISTS (SELECT 1 FROM existing_user)
  RETURNING id, email
)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM existing_user) THEN 'Updated existing super admin: ' || (SELECT email FROM existing_user)
    WHEN EXISTS (SELECT 1 FROM new_user) THEN 'Created new super admin: ' || (SELECT email FROM new_user)
    ELSE 'No changes made'
  END as result;

-- 3) Verify the super admin was created/updated
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM users 
  WHERE role = 'super_admin' AND email = 'admin@yourdomain.com';
  
  IF admin_count > 0 THEN
    RAISE NOTICE '✅ Super admin successfully created/verified: admin@yourdomain.com';
    RAISE NOTICE '🔐 Default password: VenueAdmin2024! (CHANGE IMMEDIATELY AFTER FIRST LOGIN)';
    RAISE NOTICE '⚠️  This password must be changed on first login for security';
  ELSE
    RAISE NOTICE '❌ Super admin creation failed';
  END IF;
END $$;

-- 4) Show login instructions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 SUPER ADMIN LOGIN INSTRUCTIONS:';
  RAISE NOTICE '   Email: admin@yourdomain.com';
  RAISE NOTICE '   Password: VenueAdmin2024!';
  RAISE NOTICE '   Role: super_admin';
  RAISE NOTICE '';
  RAISE NOTICE '🚨 SECURITY REMINDER:';
  RAISE NOTICE '   1. Login immediately and change the password';
  RAISE NOTICE '   2. Enable MFA if available';
  RAISE NOTICE '   3. This migration should only be run once';
  RAISE NOTICE '   4. Consider deleting this migration file after use';
END $$;