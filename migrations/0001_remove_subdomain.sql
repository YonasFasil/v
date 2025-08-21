-- Remove subdomain column from tenants table
-- This migration safely removes the subdomain functionality

-- Drop the unique constraint on subdomain first
ALTER TABLE "tenants" DROP CONSTRAINT IF EXISTS "tenants_subdomain_unique";

-- Drop the subdomain column
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "subdomain";

-- Update any existing tenant-isolation logic to use slug instead
-- The application already uses path-based routing with slug, so this is safe