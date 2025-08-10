CREATE TABLE "ai_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"data" jsonb,
	"priority" text DEFAULT 'medium' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" varchar,
	"tenant_id" varchar,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"meta" jsonb,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"contract_id" varchar,
	"event_name" text NOT NULL,
	"event_type" text NOT NULL,
	"customer_id" varchar,
	"venue_id" varchar,
	"space_id" varchar,
	"event_date" timestamp NOT NULL,
	"end_date" timestamp,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"guest_count" integer NOT NULL,
	"setup_style" text,
	"package_id" varchar,
	"proposal_status" text DEFAULT 'none',
	"proposal_sent_at" timestamp,
	"proposal_viewed_at" timestamp,
	"proposal_responded_at" timestamp,
	"selected_services" text[],
	"pricing_model" text DEFAULT 'fixed',
	"item_quantities" jsonb,
	"pricing_overrides" jsonb,
	"tax_fee_overrides" jsonb,
	"service_tax_overrides" jsonb,
	"status" text DEFAULT 'inquiry' NOT NULL,
	"total_amount" numeric(10, 2),
	"deposit_amount" numeric(10, 2),
	"deposit_paid" boolean DEFAULT false,
	"is_multi_day" boolean DEFAULT false,
	"notes" text,
	"cancellation_reason" text,
	"cancellation_note" text,
	"cancelled_at" timestamp,
	"cancelled_by" varchar,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "campaign_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "communications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar,
	"customer_id" varchar,
	"type" text NOT NULL,
	"direction" text NOT NULL,
	"subject" text,
	"message" text NOT NULL,
	"sent_by" text,
	"sent_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"status" text DEFAULT 'sent'
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"contract_name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"lead_score" integer DEFAULT 0,
	"status" text DEFAULT 'lead' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feature_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"billing_modes" jsonb NOT NULL,
	"stripe_product_id" text,
	"stripe_price_ids" jsonb,
	"trial_days" integer,
	"limits" jsonb NOT NULL,
	"flags" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "feature_packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"type" text NOT NULL,
	"body" text NOT NULL,
	"meta" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_tags" (
	"lead_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp,
	"assigned_to" varchar,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" varchar,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"event_type" text NOT NULL,
	"guest_count" integer NOT NULL,
	"date_start" timestamp,
	"date_end" timestamp,
	"budget_min" numeric(10, 2),
	"budget_max" numeric(10, 2),
	"preferred_contact" text DEFAULT 'email' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'NEW' NOT NULL,
	"source_id" varchar,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"consent_email" boolean DEFAULT true,
	"consent_sms" boolean DEFAULT false,
	"converted_customer_id" varchar,
	"proposal_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"pricing_model" text DEFAULT 'fixed' NOT NULL,
	"applicable_space_ids" text[],
	"included_service_ids" text[],
	"enabled_tax_ids" text[],
	"enabled_fee_ids" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"payment_type" text NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" varchar,
	"customer_id" varchar,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"total_amount" numeric(10, 2),
	"deposit_amount" numeric(10, 2),
	"deposit_type" text DEFAULT 'percentage',
	"deposit_value" numeric(5, 2),
	"package_id" varchar,
	"selected_services" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"email_opened" boolean DEFAULT false,
	"email_opened_at" timestamp,
	"signature" text,
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"deposit_paid" boolean DEFAULT false,
	"deposit_paid_at" timestamp,
	"payment_intent_id" text,
	"created_at" timestamp DEFAULT now(),
	"event_type" text,
	"event_date" timestamp,
	"start_time" text,
	"end_time" text,
	"guest_count" integer,
	"venue_id" varchar,
	"space_id" varchar
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"pricing_model" text DEFAULT 'fixed' NOT NULL,
	"enabled_tax_ids" text[],
	"enabled_fee_ids" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "setup_styles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_name" text,
	"category" text DEFAULT 'general' NOT NULL,
	"min_capacity" integer,
	"max_capacity" integer,
	"floor_plan" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spaces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"venue_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"price_per_hour" numeric(10, 2),
	"amenities" text[],
	"image_url" text,
	"available_setup_styles" text[],
	"floor_plan" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "super_admins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'super_admin' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "super_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" varchar,
	"booking_id" varchar,
	"due_date" timestamp,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tax_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"calculation" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"apply_to" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_taxable" boolean DEFAULT false,
	"applicable_tax_ids" text[],
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"user_id" varchar,
	"action" text NOT NULL,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"name" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_temporary_password" boolean DEFAULT false,
	"must_change_password" boolean DEFAULT false,
	"last_login_at" timestamp,
	"invited_by" varchar,
	"invited_at" timestamp,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subdomain" text,
	"custom_domain" text,
	"contact_email" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text,
	"plan_slug" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"trial_end" timestamp,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"usage" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "tenants_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"venue_id" varchar NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"duration" integer DEFAULT 30 NOT NULL,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"attendee_count" integer DEFAULT 1,
	"notes" text,
	"conducted_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'manager' NOT NULL,
	"stripe_account_id" text,
	"stripe_account_status" text,
	"stripe_onboarding_completed" boolean DEFAULT false,
	"stripe_charges_enabled" boolean DEFAULT false,
	"stripe_payouts_enabled" boolean DEFAULT false,
	"stripe_connected_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"capacity" integer NOT NULL,
	"price_per_hour" numeric(10, 2),
	"amenities" text[],
	"image_url" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communications" ADD CONSTRAINT "communications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_id_campaign_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."campaign_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_customer_id_customers_id_fk" FOREIGN KEY ("converted_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_activities" ADD CONSTRAINT "tenant_activities_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_activities" ADD CONSTRAINT "tenant_activities_user_id_tenant_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_invited_by_tenant_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."tenant_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_conducted_by_users_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;