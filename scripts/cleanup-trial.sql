-- SQL script to manually remove trial data from database
-- Run these commands in your PostgreSQL database

-- 1. Drop trial_days column from subscription_packages
ALTER TABLE subscription_packages DROP COLUMN IF EXISTS trial_days CASCADE;

-- 2. Drop trial_ends_at column from tenants  
ALTER TABLE tenants DROP COLUMN IF EXISTS trial_ends_at CASCADE;

-- 3. Update all trial tenants to active status
UPDATE tenants SET status = 'active' WHERE status = 'trial';

-- 4. Verify the changes
SELECT 'Tenant Status Distribution:' as info;
SELECT status, COUNT(*) as count FROM tenants GROUP BY status ORDER BY status;

SELECT 'Current Packages:' as info;
SELECT name, price, max_venues, max_users, max_bookings_per_month 
FROM subscription_packages 
ORDER BY name;