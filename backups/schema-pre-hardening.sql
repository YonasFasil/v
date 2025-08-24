-- Schema dump generated on 2025-08-24T16:17:47.823Z
-- Database: venuedb
-- Purpose: Pre-hardening backup for tenant isolation implementation

-- Table: ai_insights
CREATE TABLE ai_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  data jsonb,
  priority text NOT NULL DEFAULT 'medium'::text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: bookings
CREATE TABLE bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  contract_id uuid,
  event_name text NOT NULL,
  event_type text NOT NULL,
  customer_id uuid,
  venue_id uuid,
  space_id uuid,
  event_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone,
  start_time text NOT NULL,
  end_time text NOT NULL,
  guest_count integer(32) NOT NULL,
  setup_style text,
  package_id uuid,
  proposal_id uuid,
  proposal_status text DEFAULT 'none'::text,
  proposal_sent_at timestamp without time zone,
  proposal_viewed_at timestamp without time zone,
  proposal_responded_at timestamp without time zone,
  selected_services ARRAY,
  pricing_model text DEFAULT 'fixed'::text,
  item_quantities jsonb,
  pricing_overrides jsonb,
  tax_fee_overrides jsonb,
  service_tax_overrides jsonb,
  status text NOT NULL DEFAULT 'inquiry'::text,
  total_amount numeric(10,2),
  deposit_amount numeric(10,2),
  deposit_paid boolean DEFAULT false,
  is_multi_day boolean DEFAULT false,
  notes text,
  cancellation_reason text,
  cancellation_note text,
  cancelled_at timestamp without time zone,
  cancelled_by uuid,
  completed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: campaign_sources
CREATE TABLE campaign_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: communications
CREATE TABLE communications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  booking_id uuid,
  proposal_id uuid,
  customer_id uuid,
  type text NOT NULL,
  direction text NOT NULL,
  subject text,
  message text NOT NULL,
  sender text,
  recipient text,
  email_message_id text,
  sent_at timestamp without time zone DEFAULT now(),
  read_at timestamp without time zone,
  status text DEFAULT 'sent'::text
);

-- Table: companies
CREATE TABLE companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  industry text,
  description text,
  website text,
  address text,
  phone text,
  email text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: contracts
CREATE TABLE contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  contract_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  total_amount numeric(10,2),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: customers
CREATE TABLE customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  customer_type text NOT NULL DEFAULT 'individual'::text,
  company_id uuid,
  job_title text,
  department text,
  lead_score integer(32) DEFAULT 0,
  status text NOT NULL DEFAULT 'lead'::text,
  notes text,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: lead_activities
CREATE TABLE lead_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  type text NOT NULL,
  body text NOT NULL,
  meta jsonb,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: lead_tags
CREATE TABLE lead_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  tag_id uuid NOT NULL
);

-- Table: lead_tasks
CREATE TABLE lead_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_at timestamp without time zone,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'OPEN'::text,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: leads
CREATE TABLE leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  venue_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text NOT NULL,
  guest_count integer(32) NOT NULL,
  date_start timestamp without time zone,
  date_end timestamp without time zone,
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  preferred_contact text NOT NULL DEFAULT 'email'::text,
  notes text,
  status text NOT NULL DEFAULT 'NEW'::text,
  source_id uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_email boolean DEFAULT true,
  consent_sms boolean DEFAULT false,
  converted_customer_id uuid,
  proposal_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: packages
CREATE TABLE packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  pricing_model text NOT NULL DEFAULT 'fixed'::text,
  applicable_space_ids ARRAY,
  included_service_ids ARRAY,
  enabled_tax_ids ARRAY,
  enabled_fee_ids ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: payments
CREATE TABLE payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  booking_id uuid,
  amount numeric(10,2) NOT NULL,
  payment_type text NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  transaction_id text,
  processed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: proposals
CREATE TABLE proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  booking_id uuid,
  customer_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  total_amount numeric(10,2),
  deposit_amount numeric(10,2),
  deposit_type text DEFAULT 'percentage'::text,
  deposit_value numeric(5,2),
  package_id uuid,
  selected_services ARRAY,
  status text NOT NULL DEFAULT 'draft'::text,
  valid_until timestamp without time zone,
  sent_at timestamp without time zone,
  viewed_at timestamp without time zone,
  email_opened boolean DEFAULT false,
  email_opened_at timestamp without time zone,
  open_count integer(32) DEFAULT 0,
  signature text,
  accepted_at timestamp without time zone,
  declined_at timestamp without time zone,
  deposit_paid boolean DEFAULT false,
  deposit_paid_at timestamp without time zone,
  payment_intent_id text,
  created_at timestamp without time zone DEFAULT now(),
  event_type text,
  event_date timestamp without time zone,
  start_time text,
  end_time text,
  guest_count integer(32),
  venue_id uuid,
  space_id uuid
);

-- Table: services
CREATE TABLE services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  pricing_model text NOT NULL DEFAULT 'fixed'::text,
  enabled_tax_ids ARRAY,
  enabled_fee_ids ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: settings
CREATE TABLE settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: setup_styles
CREATE TABLE setup_styles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon_name text,
  category text NOT NULL DEFAULT 'general'::text,
  min_capacity integer(32),
  max_capacity integer(32),
  floor_plan jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: spaces
CREATE TABLE spaces (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  capacity integer(32) NOT NULL,
  price_per_hour numeric(10,2),
  amenities ARRAY,
  image_url text,
  available_setup_styles ARRAY,
  floor_plan jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: subscription_packages
CREATE TABLE subscription_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  billing_interval text NOT NULL DEFAULT 'monthly'::text,
  max_venues integer(32) DEFAULT 1,
  max_users integer(32) DEFAULT 3,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer(32) DEFAULT 0,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: tags
CREATE TABLE tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6'::text,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: tasks
CREATE TABLE tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid,
  booking_id uuid,
  due_date timestamp without time zone,
  priority text NOT NULL DEFAULT 'medium'::text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: tax_settings
CREATE TABLE tax_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  calculation text NOT NULL,
  value numeric(10,2) NOT NULL,
  apply_to text NOT NULL,
  is_active boolean DEFAULT true,
  is_taxable boolean DEFAULT false,
  applicable_tax_ids ARRAY,
  description text,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: tenants
CREATE TABLE tenants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  custom_domain text,
  subscription_package_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'trial'::text,
  subscription_started_at timestamp without time zone,
  subscription_ends_at timestamp without time zone,
  stripe_customer_id text,
  stripe_subscription_id text,
  logo_url text,
  primary_color text DEFAULT '#3b82f6'::text,
  custom_css text,
  current_users integer(32) DEFAULT 0,
  current_venues integer(32) DEFAULT 0,
  monthly_bookings integer(32) DEFAULT 0,
  last_billing_date timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Table: tours
CREATE TABLE tours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  lead_id uuid NOT NULL,
  venue_id uuid NOT NULL,
  scheduled_at timestamp without time zone NOT NULL,
  duration integer(32) NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'SCHEDULED'::text,
  attendee_count integer(32) DEFAULT 1,
  notes text,
  conducted_by uuid,
  created_at timestamp without time zone DEFAULT now()
);

-- Table: users
CREATE TABLE users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL,
  password text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  tenant_id uuid,
  role text NOT NULL DEFAULT 'tenant_user'::text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  last_login_at timestamp without time zone,
  stripe_account_id text,
  stripe_account_status text,
  stripe_onboarding_completed boolean DEFAULT false,
  stripe_charges_enabled boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,
  stripe_connected_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  email_verified boolean DEFAULT false,
  email_verification_token text,
  email_verification_expires timestamp without time zone
);

-- Table: venues
CREATE TABLE venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  capacity integer(32),
  price_per_hour numeric(10,2),
  amenities ARRAY,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX ai_insights_pkey ON public.ai_insights USING btree (id);
CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id);
CREATE UNIQUE INDEX campaign_sources_pkey ON public.campaign_sources USING btree (id);
CREATE UNIQUE INDEX campaign_sources_slug_unique ON public.campaign_sources USING btree (slug);
CREATE UNIQUE INDEX communications_email_message_id_unique ON public.communications USING btree (email_message_id);
CREATE UNIQUE INDEX communications_pkey ON public.communications USING btree (id);
CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);
CREATE UNIQUE INDEX contracts_pkey ON public.contracts USING btree (id);
CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);
CREATE UNIQUE INDEX lead_activities_pkey ON public.lead_activities USING btree (id);
CREATE UNIQUE INDEX lead_tags_pkey ON public.lead_tags USING btree (id);
CREATE UNIQUE INDEX lead_tasks_pkey ON public.lead_tasks USING btree (id);
CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);
CREATE UNIQUE INDEX packages_pkey ON public.packages USING btree (id);
CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);
CREATE UNIQUE INDEX proposals_pkey ON public.proposals USING btree (id);
CREATE UNIQUE INDEX services_pkey ON public.services USING btree (id);
CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id);
CREATE UNIQUE INDEX setup_styles_pkey ON public.setup_styles USING btree (id);
CREATE UNIQUE INDEX spaces_pkey ON public.spaces USING btree (id);
CREATE UNIQUE INDEX subscription_packages_pkey ON public.subscription_packages USING btree (id);
CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);
CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);
CREATE UNIQUE INDEX tax_settings_pkey ON public.tax_settings USING btree (id);
CREATE UNIQUE INDEX tenants_pkey ON public.tenants USING btree (id);
CREATE UNIQUE INDEX tenants_slug_unique ON public.tenants USING btree (slug);
CREATE UNIQUE INDEX tours_pkey ON public.tours USING btree (id);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);
CREATE UNIQUE INDEX users_username_unique ON public.users USING btree (username);
CREATE UNIQUE INDEX venues_pkey ON public.venues USING btree (id);

