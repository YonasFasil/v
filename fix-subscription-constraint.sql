-- Fix subscription_package_id constraint to allow NULL values
-- This allows tenants to exist without an assigned package

ALTER TABLE tenants ALTER COLUMN subscription_package_id DROP NOT NULL;

-- Update any existing NULL values to have a default starter package if needed
-- (Optional - uncomment if you want to ensure all tenants have packages)
-- UPDATE tenants SET subscription_package_id = (SELECT id FROM subscription_packages WHERE name = 'Starter' LIMIT 1) WHERE subscription_package_id IS NULL;