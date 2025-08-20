-- CRITICAL: Multi-tenant isolation migration
-- This migration adds tenantId to ALL tables that were missing it
-- and implements Row-Level Security for true database-level isolation

-- Phase 1: Add tenantId columns to existing tables
ALTER TABLE setup_styles ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE proposals ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE settings ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE communications ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE payments ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE tasks ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE ai_insights ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE packages ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE services ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE tax_settings ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE campaign_sources ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE tags ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE leads ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE lead_activities ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE lead_tags ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE lead_tasks ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);
ALTER TABLE tours ADD COLUMN tenant_id VARCHAR REFERENCES tenants(id);

-- Phase 2: Data migration - Populate tenantId from related tables
-- For tables that can inherit tenant from bookings
UPDATE communications 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE communications.booking_id = b.id;

UPDATE payments 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE payments.booking_id = b.id;

UPDATE tasks 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE tasks.booking_id = b.id;

-- For proposals, inherit from either booking or customer
UPDATE proposals 
SET tenant_id = b.tenant_id 
FROM bookings b 
WHERE proposals.booking_id = b.id;

UPDATE proposals 
SET tenant_id = c.tenant_id 
FROM customers c 
WHERE proposals.customer_id = c.id 
AND proposals.tenant_id IS NULL;

-- For leads, inherit from venues
UPDATE leads 
SET tenant_id = v.tenant_id 
FROM venues v 
WHERE leads.venue_id = v.id;

-- For lead activities, inherit from leads
UPDATE lead_activities 
SET tenant_id = l.tenant_id 
FROM leads l 
WHERE lead_activities.lead_id = l.id;

-- For lead tasks, inherit from leads
UPDATE lead_tasks 
SET tenant_id = l.tenant_id 
FROM leads l 
WHERE lead_tasks.lead_id = l.id;

-- For tours, inherit from leads or venues
UPDATE tours 
SET tenant_id = l.tenant_id 
FROM leads l 
WHERE tours.lead_id = l.id;

-- Phase 3: Set NOT NULL constraints after data migration
ALTER TABLE setup_styles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE proposals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE communications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ai_insights ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE packages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE services ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tax_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE campaign_sources ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE lead_activities ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE lead_tags ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE lead_tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tours ALTER COLUMN tenant_id SET NOT NULL;

-- Phase 4: Enable Row-Level Security on ALL tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Phase 5: Create universal tenant isolation policies
-- Policy for super_admin - can see all data
CREATE POLICY super_admin_access ON tenants FOR ALL TO public 
  USING (current_setting('app.user_role', true) = 'super_admin');

-- Tenant isolation policies for all tables
CREATE POLICY tenant_isolation ON users FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON venues FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON spaces FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    venue_id IN (
      SELECT id FROM venues WHERE tenant_id = current_setting('app.current_tenant', true)::varchar
    )
  );

CREATE POLICY tenant_isolation ON setup_styles FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON companies FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON customers FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON contracts FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON bookings FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON proposals FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON settings FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON communications FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON payments FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON tasks FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON packages FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON services FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON tax_settings FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON tags FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON leads FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON lead_activities FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON lead_tasks FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON tours FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON ai_insights FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON campaign_sources FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

CREATE POLICY tenant_isolation ON lead_tags FOR ALL TO public 
  USING (
    current_setting('app.user_role', true) = 'super_admin' OR
    tenant_id = current_setting('app.current_tenant', true)::varchar
  );

-- Phase 6: Create indexes for performance
CREATE INDEX idx_setup_styles_tenant_id ON setup_styles(tenant_id);
CREATE INDEX idx_proposals_tenant_id ON proposals(tenant_id);
CREATE INDEX idx_settings_tenant_id ON settings(tenant_id);
CREATE INDEX idx_communications_tenant_id ON communications(tenant_id);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_ai_insights_tenant_id ON ai_insights(tenant_id);
CREATE INDEX idx_packages_tenant_id ON packages(tenant_id);
CREATE INDEX idx_services_tenant_id ON services(tenant_id);
CREATE INDEX idx_tax_settings_tenant_id ON tax_settings(tenant_id);
CREATE INDEX idx_campaign_sources_tenant_id ON campaign_sources(tenant_id);
CREATE INDEX idx_tags_tenant_id ON tags(tenant_id);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_lead_activities_tenant_id ON lead_activities(tenant_id);
CREATE INDEX idx_lead_tags_tenant_id ON lead_tags(tenant_id);
CREATE INDEX idx_lead_tasks_tenant_id ON lead_tasks(tenant_id);
CREATE INDEX idx_tours_tenant_id ON tours(tenant_id);

-- Phase 7: Update unique constraints to be tenant-scoped
DROP INDEX IF EXISTS tags_name_key;
CREATE UNIQUE INDEX tags_name_tenant_unique ON tags(name, tenant_id);

-- Phase 8: Fix settings table unique constraint to be tenant-scoped
DROP INDEX IF EXISTS settings_key_key;
CREATE UNIQUE INDEX settings_key_tenant_unique ON settings(key, tenant_id);