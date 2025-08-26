-- Migration: Remove custom domain functionality
-- Removes the custom_domain column from tenants table

-- Remove the custom_domain column from tenants table
ALTER TABLE tenants DROP COLUMN IF EXISTS custom_domain;