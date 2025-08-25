-- Migration: Super-admin Assume Tenant Audit System
-- Purpose: Track when super-admins assume tenant context for debugging/support
-- 
-- Security Impact:
-- - Creates audit trail for all super-admin tenant assumptions
-- - Enables time-boxed access with short-lived tokens
-- - Makes admin access explicit and traceable
-- - Prevents unauthorized tenant data access

BEGIN;

-- ============================================================================
-- CREATE ADMIN AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  reason text NOT NULL,
  ip inet,
  user_agent text,
  token_expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT NOW() NOT NULL
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS admin_audit_admin_user_id_idx ON admin_audit(admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_tenant_id_idx ON admin_audit(tenant_id);
CREATE INDEX IF NOT EXISTS admin_audit_created_at_idx ON admin_audit(created_at);
CREATE INDEX IF NOT EXISTS admin_audit_expires_at_idx ON admin_audit(token_expires_at);

-- Add foreign key constraint to users table
ALTER TABLE admin_audit ADD CONSTRAINT admin_audit_admin_user_fk 
  FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE admin_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Super-admins can view all audit records
CREATE POLICY admin_audit_super_admin_read ON admin_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = current_setting('app.current_user_id', true) 
        AND users.role = 'super_admin'
    )
  );

-- Super-admins can insert their own audit records
CREATE POLICY admin_audit_super_admin_insert ON admin_audit
  FOR INSERT WITH CHECK (
    admin_user_id::text = current_setting('app.current_user_id', true)
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = current_setting('app.current_user_id', true) 
        AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to application role
GRANT SELECT, INSERT ON admin_audit TO venuine_app;

DO $$
BEGIN
  RAISE NOTICE 'Admin audit table created with RLS policies applied';
END $$;

COMMIT;