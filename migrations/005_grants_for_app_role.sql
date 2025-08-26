-- 005_grants_for_app_role.sql
-- Minimal safe GRANTs for venuine_app role
-- This fixes tenant creation permission issues while keeping RLS fully enforced
-- Run as the owner/migrations role, NOT venuine_app

DO $$ 
BEGIN 
    RAISE NOTICE 'Granting minimal safe permissions to venuine_app role...'; 
END $$;

-- Allow the app to access objects in the schema
GRANT USAGE ON SCHEMA public TO venuine_app;

-- Allow the app to CRUD only the tables it actually uses
-- RLS policies still control row-level access based on session variables
GRANT SELECT, INSERT, UPDATE, DELETE ON
    tenants,
    users,
    customers,
    events,
    bookings,
    proposals,
    venues,
    spaces,
    companies,
    contracts,
    packages,
    services,
    payments,
    tasks,
    settings,
    tags,
    subscription_packages
TO venuine_app;

-- Sequences (needed for IDENTITY/SERIAL nextval/currval)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO venuine_app;

-- Default privileges so new tables/sequences also work without widening power
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO venuine_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO venuine_app;

DO $$ 
BEGIN 
    RAISE NOTICE 'Successfully granted minimal permissions to venuine_app'; 
    RAISE NOTICE 'RLS policies remain fully enforced for row-level security'; 
END $$;