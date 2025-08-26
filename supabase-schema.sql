-- Complete Supabase Schema Setup for Venue Booking SaaS

-- Create subscription_packages table
CREATE TABLE IF NOT EXISTS subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  trial_days INTEGER DEFAULT 30,
  max_venues INTEGER DEFAULT 999,
  max_users INTEGER DEFAULT 999,
  max_bookings_per_month INTEGER DEFAULT 9999,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subscription_package_id UUID REFERENCES subscription_packages(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  subscription_started_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'tenant_user',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT users_username_unique UNIQUE (username),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  price_per_hour DECIMAL(10,2),
  amenities TEXT[],
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create spaces table
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  venue_id UUID REFERENCES venues(id) NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER,
  price_per_hour DECIMAL(10,2),
  setup_fee DECIMAL(10,2),
  amenities TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  contract_id UUID,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  venue_id UUID REFERENCES venues(id),
  space_id UUID REFERENCES spaces(id),
  event_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  setup_style TEXT,
  status TEXT NOT NULL DEFAULT 'inquiry',
  total_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  is_multi_day BOOLEAN DEFAULT false,
  notes TEXT,
  cancellation_reason TEXT,
  cancellation_note TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by UUID,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create all other supporting tables
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  contract_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  status TEXT DEFAULT 'draft',
  terms TEXT,
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  total_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  deposit_type TEXT DEFAULT 'percentage',
  deposit_value DECIMAL(5,2),
  package_id UUID,
  selected_services TEXT[],
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until TIMESTAMP,
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  due_date TIMESTAMP,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  unit TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  services JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setup_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  capacity_min INTEGER,
  capacity_max INTEGER,
  setup_fee DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  type TEXT DEFAULT 'percentage',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  key TEXT NOT NULL,
  value JSONB,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

-- Lead management tables
CREATE TABLE IF NOT EXISTS campaign_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  source_id UUID REFERENCES campaign_sources(id),
  status TEXT DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes TEXT,
  converted_at TIMESTAMP,
  converted_to_customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  lead_id UUID REFERENCES leads(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES users(id),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  lead_id UUID REFERENCES leads(id),
  customer_id UUID REFERENCES customers(id),
  venue_id UUID REFERENCES venues(id),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription package
INSERT INTO subscription_packages (id, name, description, price, billing_interval, trial_days, max_venues, max_users, max_bookings_per_month, features, is_active, sort_order, created_at)
VALUES (gen_random_uuid(), 'Enterprise', 'Full access package for enterprise customers', 0.00, 'monthly', 30, 999, 999, 9999, '["all_features"]'::jsonb, true, 0, NOW())
ON CONFLICT DO NOTHING;

-- Insert super admin user (password is: VenueAdmin2024!)
INSERT INTO users (username, password, name, email, role, permissions, is_active, created_at)
VALUES ('superadmin', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super Administrator', 'admin@yourdomain.com', 'super_admin', '["all_permissions"]'::jsonb, true, NOW())
ON CONFLICT (username) DO NOTHING;