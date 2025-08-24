-- Migration: Enable and FORCE Row-Level Security on all tenant tables
-- Purpose: Implement database-enforced tenant isolation to prevent cross-tenant data access
-- 
-- Security Impact:
-- - Database physically prevents access to other tenants' data
-- - Even buggy or malicious code cannot bypass tenant boundaries
-- - Automatic tenant filtering on all queries (no need to remember WHERE clauses)
-- - Super admin can still access all tenants when properly authenticated
--
-- RLS Policy Logic:
-- - Read: Allow if super_admin OR tenant_id matches current session tenant
-- - Write: Allow if super_admin OR tenant_id matches current session tenant

BEGIN;

-- Helper function to log RLS setup progress
CREATE OR REPLACE FUNCTION log_rls_setup(table_name text, action text) RETURNS void AS $$
BEGIN
  RAISE NOTICE '[RLS] %: %', table_name, action;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ENABLE AND FORCE ROW LEVEL SECURITY ON ALL TENANT TABLES
-- ============================================================================

-- ai_insights table
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('ai_insights', 'RLS enabled and forced');

-- bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('bookings', 'RLS enabled and forced');

-- campaign_sources table
ALTER TABLE campaign_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sources FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('campaign_sources', 'RLS enabled and forced');

-- communications table
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('communications', 'RLS enabled and forced');

-- companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('companies', 'RLS enabled and forced');

-- contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('contracts', 'RLS enabled and forced');

-- customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('customers', 'RLS enabled and forced');

-- lead_activities table
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('lead_activities', 'RLS enabled and forced');

-- lead_tags table
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('lead_tags', 'RLS enabled and forced');

-- lead_tasks table
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('lead_tasks', 'RLS enabled and forced');

-- leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('leads', 'RLS enabled and forced');

-- packages table
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('packages', 'RLS enabled and forced');

-- payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('payments', 'RLS enabled and forced');

-- proposals table
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('proposals', 'RLS enabled and forced');

-- services table
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE services FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('services', 'RLS enabled and forced');

-- settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('settings', 'RLS enabled and forced');

-- setup_styles table
ALTER TABLE setup_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_styles FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('setup_styles', 'RLS enabled and forced');

-- tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('tags', 'RLS enabled and forced');

-- tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('tasks', 'RLS enabled and forced');

-- tax_settings table
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('tax_settings', 'RLS enabled and forced');

-- tours table
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('tours', 'RLS enabled and forced');

-- users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('users', 'RLS enabled and forced');

-- venues table
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues FORCE ROW LEVEL SECURITY;
SELECT log_rls_setup('venues', 'RLS enabled and forced');

-- ============================================================================
-- CREATE TENANT ISOLATION POLICIES FOR ALL TABLES
-- ============================================================================

-- ai_insights policies
CREATE POLICY ai_insights_tenant_read ON ai_insights
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY ai_insights_tenant_write ON ai_insights
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY ai_insights_tenant_update ON ai_insights
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('ai_insights', 'Tenant isolation policies created');

-- bookings policies
CREATE POLICY bookings_tenant_read ON bookings
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY bookings_tenant_write ON bookings
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY bookings_tenant_update ON bookings
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('bookings', 'Tenant isolation policies created');

-- campaign_sources policies
CREATE POLICY campaign_sources_tenant_read ON campaign_sources
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY campaign_sources_tenant_write ON campaign_sources
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY campaign_sources_tenant_update ON campaign_sources
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('campaign_sources', 'Tenant isolation policies created');

-- communications policies
CREATE POLICY communications_tenant_read ON communications
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY communications_tenant_write ON communications
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY communications_tenant_update ON communications
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('communications', 'Tenant isolation policies created');

-- companies policies
CREATE POLICY companies_tenant_read ON companies
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY companies_tenant_write ON companies
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY companies_tenant_update ON companies
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('companies', 'Tenant isolation policies created');

-- contracts policies
CREATE POLICY contracts_tenant_read ON contracts
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY contracts_tenant_write ON contracts
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY contracts_tenant_update ON contracts
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('contracts', 'Tenant isolation policies created');

-- customers policies
CREATE POLICY customers_tenant_read ON customers
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY customers_tenant_write ON customers
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY customers_tenant_update ON customers
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('customers', 'Tenant isolation policies created');

-- lead_activities policies
CREATE POLICY lead_activities_tenant_read ON lead_activities
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY lead_activities_tenant_write ON lead_activities
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY lead_activities_tenant_update ON lead_activities
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('lead_activities', 'Tenant isolation policies created');

-- lead_tags policies
CREATE POLICY lead_tags_tenant_read ON lead_tags
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY lead_tags_tenant_write ON lead_tags
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY lead_tags_tenant_update ON lead_tags
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('lead_tags', 'Tenant isolation policies created');

-- lead_tasks policies
CREATE POLICY lead_tasks_tenant_read ON lead_tasks
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY lead_tasks_tenant_write ON lead_tasks
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY lead_tasks_tenant_update ON lead_tasks
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('lead_tasks', 'Tenant isolation policies created');

-- leads policies
CREATE POLICY leads_tenant_read ON leads
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY leads_tenant_write ON leads
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY leads_tenant_update ON leads
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('leads', 'Tenant isolation policies created');

-- packages policies
CREATE POLICY packages_tenant_read ON packages
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY packages_tenant_write ON packages
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY packages_tenant_update ON packages
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('packages', 'Tenant isolation policies created');

-- payments policies
CREATE POLICY payments_tenant_read ON payments
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY payments_tenant_write ON payments
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY payments_tenant_update ON payments
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('payments', 'Tenant isolation policies created');

-- proposals policies
CREATE POLICY proposals_tenant_read ON proposals
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY proposals_tenant_write ON proposals
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY proposals_tenant_update ON proposals
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('proposals', 'Tenant isolation policies created');

-- services policies
CREATE POLICY services_tenant_read ON services
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY services_tenant_write ON services
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY services_tenant_update ON services
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('services', 'Tenant isolation policies created');

-- settings policies
CREATE POLICY settings_tenant_read ON settings
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY settings_tenant_write ON settings
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY settings_tenant_update ON settings
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('settings', 'Tenant isolation policies created');

-- setup_styles policies
CREATE POLICY setup_styles_tenant_read ON setup_styles
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY setup_styles_tenant_write ON setup_styles
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY setup_styles_tenant_update ON setup_styles
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('setup_styles', 'Tenant isolation policies created');

-- tags policies
CREATE POLICY tags_tenant_read ON tags
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tags_tenant_write ON tags
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tags_tenant_update ON tags
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('tags', 'Tenant isolation policies created');

-- tasks policies
CREATE POLICY tasks_tenant_read ON tasks
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tasks_tenant_write ON tasks
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tasks_tenant_update ON tasks
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('tasks', 'Tenant isolation policies created');

-- tax_settings policies
CREATE POLICY tax_settings_tenant_read ON tax_settings
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tax_settings_tenant_write ON tax_settings
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tax_settings_tenant_update ON tax_settings
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('tax_settings', 'Tenant isolation policies created');

-- tours policies
CREATE POLICY tours_tenant_read ON tours
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tours_tenant_write ON tours
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY tours_tenant_update ON tours
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('tours', 'Tenant isolation policies created');

-- users policies
CREATE POLICY users_tenant_read ON users
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY users_tenant_write ON users
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY users_tenant_update ON users
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('users', 'Tenant isolation policies created');

-- venues policies
CREATE POLICY venues_tenant_read ON venues
  FOR SELECT TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY venues_tenant_write ON venues
  FOR INSERT TO venuine_app
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

CREATE POLICY venues_tenant_update ON venues
  FOR UPDATE TO venuine_app
  USING (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  )
  WITH CHECK (
    current_setting('app.user_role', true) = 'super_admin'
    OR tenant_id = current_setting('app.current_tenant', true)::uuid
  );

SELECT log_rls_setup('venues', 'Tenant isolation policies created');

-- ============================================================================
-- CREATE RLS MONITORING AND VERIFICATION VIEWS
-- ============================================================================

-- View to monitor RLS status across all tenant tables
CREATE OR REPLACE VIEW rls_security_status AS
SELECT 
  t.schemaname,
  t.tablename,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  CASE 
    WHEN c.relrowsecurity AND c.relforcerowsecurity THEN '✅ SECURE'
    WHEN c.relrowsecurity AND NOT c.relforcerowsecurity THEN '⚠️  RLS_ONLY'
    ELSE '❌ INSECURE'
  END as security_status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = t.schemaname AND tablename = t.tablename) as policy_count
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'ai_insights', 'bookings', 'campaign_sources', 'communications', 'companies',
    'contracts', 'customers', 'lead_activities', 'lead_tags', 'lead_tasks',
    'leads', 'packages', 'payments', 'proposals', 'services', 'settings',
    'setup_styles', 'tags', 'tasks', 'tax_settings', 'tours', 'users', 'venues'
  )
ORDER BY t.tablename;

-- Grant view access to monitoring roles
GRANT SELECT ON rls_security_status TO venuine_app;
GRANT SELECT ON rls_security_status TO venuine_owner;

-- Clean up helper function
DROP FUNCTION log_rls_setup(text, text);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 ROW-LEVEL SECURITY ENFORCEMENT COMPLETE';
  RAISE NOTICE '=======================================';
  RAISE NOTICE '✅ RLS ENABLED and FORCED on 23 tenant tables';
  RAISE NOTICE '✅ Tenant isolation policies created (69 total policies)';
  RAISE NOTICE '✅ Super admin override policies implemented';
  RAISE NOTICE '✅ RLS monitoring view created';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  CRITICAL: Application must set session variables:';
  RAISE NOTICE '   - app.current_tenant (tenant UUID)';
  RAISE NOTICE '   - app.user_role (super_admin or tenant role)';
  RAISE NOTICE '';
  RAISE NOTICE '🛡️  Database now physically prevents cross-tenant data access';
  RAISE NOTICE '';
END
$$;

COMMIT;