-- Migration: Tenant-safe Uniqueness and FK Integrity
-- Purpose: Implement per-tenant unique constraints and cross-tenant FK protection
-- 
-- Security Impact:
-- - Prevents accidental cross-tenant data references
-- - Enforces business logic constraints per tenant, not globally
-- - Ensures referential integrity respects tenant boundaries
-- - Schema-level enforcement of tenant isolation principles
--
-- Key Changes:
-- - Drop global unique constraints, add per-tenant unique indexes
-- - Add composite FK constraints ensuring tenant_id consistency
-- - Prevent cross-tenant mistakes through database schema enforcement

BEGIN;

-- ============================================================================
-- DROP EXISTING GLOBAL UNIQUE CONSTRAINTS
-- ============================================================================

-- Remove global uniqueness constraints that should be per-tenant
DO $$
BEGIN
  -- Drop campaign_sources slug global uniqueness
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'campaign_sources_slug_unique' AND table_name = 'campaign_sources') THEN
    ALTER TABLE campaign_sources DROP CONSTRAINT campaign_sources_slug_unique;
    RAISE NOTICE 'Dropped global campaign_sources slug constraint';
  END IF;
  
  -- Drop users username global uniqueness  
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'users_username_unique' AND table_name = 'users') THEN
    ALTER TABLE users DROP CONSTRAINT users_username_unique;
    RAISE NOTICE 'Dropped global users username constraint';
  END IF;
  
  -- Note: communications.email_message_id should remain globally unique as it's an external identifier
END $$;

-- ============================================================================
-- ADD PER-TENANT UNIQUE INDEXES
-- ============================================================================

-- Customers: email should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_per_tenant_idx
  ON customers(tenant_id, email);

-- Customers: add composite unique constraint on (tenant_id, id) for FK references
CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_id_per_tenant_idx
  ON customers(tenant_id, id);

-- Users: email should be unique per tenant  
CREATE UNIQUE INDEX IF NOT EXISTS users_email_per_tenant_idx
  ON users(tenant_id, email);

-- Users: username should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS users_username_per_tenant_idx
  ON users(tenant_id, username);

-- Users: add composite unique constraint on (tenant_id, id) for FK references
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_id_per_tenant_idx
  ON users(tenant_id, id);

-- Venues: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS venues_name_per_tenant_idx
  ON venues(tenant_id, name);

-- Venues: add composite unique constraint on (tenant_id, id) for FK references  
CREATE UNIQUE INDEX IF NOT EXISTS venues_tenant_id_per_tenant_idx
  ON venues(tenant_id, id);

-- Bookings: add composite unique constraint on (tenant_id, id) for FK references
CREATE UNIQUE INDEX IF NOT EXISTS bookings_tenant_id_per_tenant_idx
  ON bookings(tenant_id, id);

-- Campaign Sources: slug should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS campaign_sources_slug_per_tenant_idx
  ON campaign_sources(tenant_id, slug);

-- Campaign Sources: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS campaign_sources_name_per_tenant_idx
  ON campaign_sources(tenant_id, name);

-- Companies: email should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS companies_email_per_tenant_idx
  ON companies(tenant_id, email);

-- Companies: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS companies_name_per_tenant_idx
  ON companies(tenant_id, name);

-- Companies: add composite unique constraint on (tenant_id, id) for FK references
CREATE UNIQUE INDEX IF NOT EXISTS companies_tenant_id_per_tenant_idx
  ON companies(tenant_id, id);

-- Services: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS services_name_per_tenant_idx
  ON services(tenant_id, name);

-- Setup Styles: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS setup_styles_name_per_tenant_idx
  ON setup_styles(tenant_id, name);

-- Tags: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_per_tenant_idx
  ON tags(tenant_id, name);

-- Tax Settings: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS tax_settings_name_per_tenant_idx
  ON tax_settings(tenant_id, name);

-- Packages: name should be unique per tenant
CREATE UNIQUE INDEX IF NOT EXISTS packages_name_per_tenant_idx
  ON packages(tenant_id, name);

DO $$
BEGIN
  RAISE NOTICE 'Created per-tenant unique indexes for key business entities';
END $$;

-- ============================================================================
-- ADD TENANT-AWARE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Function to safely add tenant-aware FK constraints
CREATE OR REPLACE FUNCTION add_tenant_fk_constraint(
  table_name text,
  constraint_name text,
  local_tenant_col text,
  local_ref_col text,
  ref_table text,
  ref_tenant_col text,
  ref_id_col text
) RETURNS void AS $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.constraint_name = add_tenant_fk_constraint.constraint_name 
      AND tc.table_name = add_tenant_fk_constraint.table_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I 
                    FOREIGN KEY (%I, %I) REFERENCES %I (%I, %I)',
                   table_name, constraint_name, 
                   local_tenant_col, local_ref_col,
                   ref_table, ref_tenant_col, ref_id_col);
    RAISE NOTICE 'Added tenant-aware FK: %', constraint_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Bookings -> Customers (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'bookings', 'bookings_customer_tenant_fk',
  'tenant_id', 'customer_id',
  'customers', 'tenant_id', 'id'
);

-- Bookings -> Venues (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'bookings', 'bookings_venue_tenant_fk',
  'tenant_id', 'venue_id', 
  'venues', 'tenant_id', 'id'
);

-- Bookings -> Spaces (ensure same tenant via venue)
-- Note: Spaces don't have tenant_id directly, they inherit from venues
-- We'll add a check to ensure space belongs to venue in same tenant

-- Proposals -> Customers (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'proposals', 'proposals_customer_tenant_fk',
  'tenant_id', 'customer_id',
  'customers', 'tenant_id', 'id'
);

-- Proposals -> Venues (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'proposals', 'proposals_venue_tenant_fk',
  'tenant_id', 'venue_id',
  'venues', 'tenant_id', 'id'
);

-- Customers -> Companies (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'customers', 'customers_company_tenant_fk',
  'tenant_id', 'company_id',
  'companies', 'tenant_id', 'id'
);

-- Leads -> Venues (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'leads', 'leads_venue_tenant_fk',
  'tenant_id', 'venue_id',
  'venues', 'tenant_id', 'id'
);

-- Leads -> Customers (for converted leads, ensure same tenant)
SELECT add_tenant_fk_constraint(
  'leads', 'leads_customer_tenant_fk',
  'tenant_id', 'converted_customer_id',
  'customers', 'tenant_id', 'id'
);

-- Payments -> Bookings (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'payments', 'payments_booking_tenant_fk',
  'tenant_id', 'booking_id',
  'bookings', 'tenant_id', 'id'
);

-- Communications -> Customers (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'communications', 'communications_customer_tenant_fk',
  'tenant_id', 'customer_id',
  'customers', 'tenant_id', 'id'
);

-- Communications -> Bookings (ensure same tenant)  
SELECT add_tenant_fk_constraint(
  'communications', 'communications_booking_tenant_fk',
  'tenant_id', 'booking_id',
  'bookings', 'tenant_id', 'id'
);

-- Tasks -> Users (ensure same tenant for assigned_to)
SELECT add_tenant_fk_constraint(
  'tasks', 'tasks_user_tenant_fk',
  'tenant_id', 'assigned_to',
  'users', 'tenant_id', 'id'
);

-- Tasks -> Bookings (ensure same tenant)
SELECT add_tenant_fk_constraint(
  'tasks', 'tasks_booking_tenant_fk',
  'tenant_id', 'booking_id',
  'bookings', 'tenant_id', 'id'
);

DO $$
BEGIN
  RAISE NOTICE 'Added tenant-aware foreign key constraints';
END $$;

-- ============================================================================
-- ADD CHECK CONSTRAINTS FOR CROSS-TENANT PROTECTION
-- ============================================================================

-- Note: Check constraint with subquery not supported in PostgreSQL
-- Cross-tenant space validation will be handled at application level
-- or through triggers if needed

-- ============================================================================
-- CREATE MONITORING VIEW FOR TENANT CONSTRAINTS
-- ============================================================================

-- Note: Monitoring view creation deferred to avoid column ambiguity issues
-- Can query constraints directly using:
-- SELECT * FROM pg_indexes WHERE indexname LIKE '%_per_tenant_idx'
-- SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_name LIKE '%_tenant_fk'

-- Drop the helper function
DROP FUNCTION add_tenant_fk_constraint;

DO $$
BEGIN
  RAISE NOTICE 'Tenant-safe uniqueness and FK integrity constraints applied successfully';
END $$;

COMMIT;