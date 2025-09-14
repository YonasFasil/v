ALTER TABLE "tenants" DROP CONSTRAINT "tenants_subdomain_unique";--> statement-breakpoint
ALTER TABLE "ai_insights" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "ai_insights" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "contract_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "venue_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "space_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "package_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "proposal_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "cancelled_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "campaign_sources" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "campaign_sources" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "communications" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "communications" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "communications" ALTER COLUMN "booking_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "communications" ALTER COLUMN "proposal_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "communications" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "company_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "lead_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_activities" ALTER COLUMN "created_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tags" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tags" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tags" ALTER COLUMN "lead_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tags" ALTER COLUMN "tag_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tasks" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tasks" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tasks" ALTER COLUMN "lead_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "lead_tasks" ALTER COLUMN "assigned_to" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "venue_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "converted_customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "proposal_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "booking_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "booking_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "customer_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "package_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "venue_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "proposals" ALTER COLUMN "space_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "setup_styles" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "setup_styles" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "venue_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "assigned_to" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "booking_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_settings" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tax_settings" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "status" SET DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "tenant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "lead_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "venue_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "conducted_by" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "spaces" DROP COLUMN "available_setup_styles";--> statement-breakpoint
ALTER TABLE "spaces" DROP COLUMN "floor_plan";--> statement-breakpoint
ALTER TABLE "subscription_packages" DROP COLUMN "trial_days";--> statement-breakpoint
ALTER TABLE "subscription_packages" DROP COLUMN "max_bookings_per_month";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "subdomain";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "custom_domain";--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "trial_ends_at";--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "capacity";--> statement-breakpoint
ALTER TABLE "venues" DROP COLUMN "price_per_hour";