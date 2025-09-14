import { pgTable, foreignKey, uuid, text, boolean, timestamp, unique, jsonb, numeric, serial, bigint, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const venues = pgTable("venues", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	description: text(),
	amenities: text().array(),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "venues_tenant_id_tenants_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	tenantId: uuid("tenant_id"),
	role: text().default('tenant_user').notNull(),
	permissions: jsonb().default([]),
	isActive: boolean("is_active").default(true),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	stripeAccountId: text("stripe_account_id"),
	stripeAccountStatus: text("stripe_account_status"),
	stripeOnboardingCompleted: boolean("stripe_onboarding_completed").default(false),
	stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
	stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
	stripeConnectedAt: timestamp("stripe_connected_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "users_tenant_id_tenants_id_fk"
		}),
	unique("users_username_unique").on(table.username),
]);

export const taxSettings = pgTable("tax_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	type: text().notNull(),
	calculation: text().notNull(),
	value: numeric({ precision: 10, scale:  2 }).notNull(),
	applyTo: text("apply_to").notNull(),
	isActive: boolean("is_active").default(true),
	isTaxable: boolean("is_taxable").default(false),
	applicableTaxIds: text("applicable_tax_ids").array(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tax_settings_tenant_id_tenants_id_fk"
		}),
]);

export const drizzleMigrations = pgTable("__drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
});

export const bookings = pgTable("bookings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	contractId: uuid("contract_id"),
	eventName: text("event_name").notNull(),
	eventType: text("event_type").notNull(),
	customerId: uuid("customer_id"),
	venueId: uuid("venue_id"),
	spaceId: uuid("space_id"),
	eventDate: timestamp("event_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }),
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
	guestCount: integer("guest_count").notNull(),
	setupStyle: text("setup_style"),
	packageId: uuid("package_id"),
	proposalId: uuid("proposal_id"),
	proposalStatus: text("proposal_status").default('none'),
	proposalSentAt: timestamp("proposal_sent_at", { mode: 'string' }),
	proposalViewedAt: timestamp("proposal_viewed_at", { mode: 'string' }),
	proposalRespondedAt: timestamp("proposal_responded_at", { mode: 'string' }),
	selectedServices: text("selected_services").array(),
	pricingModel: text("pricing_model").default('fixed'),
	itemQuantities: jsonb("item_quantities"),
	pricingOverrides: jsonb("pricing_overrides"),
	taxFeeOverrides: jsonb("tax_fee_overrides"),
	serviceTaxOverrides: jsonb("service_tax_overrides"),
	status: text().default('inquiry').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  2 }),
	depositPaid: boolean("deposit_paid").default(false),
	isMultiDay: boolean("is_multi_day").default(false),
	notes: text(),
	cancellationReason: text("cancellation_reason"),
	cancellationNote: text("cancellation_note"),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
	cancelledBy: uuid("cancelled_by"),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "bookings_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.contractId],
			foreignColumns: [contracts.id],
			name: "bookings_contract_id_contracts_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "bookings_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "bookings_venue_id_venues_id_fk"
		}),
	foreignKey({
			columns: [table.spaceId],
			foreignColumns: [spaces.id],
			name: "bookings_space_id_spaces_id_fk"
		}),
	foreignKey({
			columns: [table.cancelledBy],
			foreignColumns: [users.id],
			name: "bookings_cancelled_by_users_id_fk"
		}),
]);

export const campaignSources = pgTable("campaign_sources", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "campaign_sources_tenant_id_tenants_id_fk"
		}),
	unique("campaign_sources_slug_unique").on(table.slug),
]);

export const communications = pgTable("communications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	bookingId: uuid("booking_id"),
	proposalId: uuid("proposal_id"),
	customerId: uuid("customer_id"),
	type: text().notNull(),
	direction: text().notNull(),
	subject: text(),
	message: text().notNull(),
	sender: text(),
	recipient: text(),
	emailMessageId: text("email_message_id"),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	readAt: timestamp("read_at", { mode: 'string' }),
	status: text().default('sent'),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "communications_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "communications_booking_id_bookings_id_fk"
		}),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "communications_proposal_id_proposals_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "communications_customer_id_customers_id_fk"
		}),
	unique("communications_email_message_id_unique").on(table.emailMessageId),
]);

export const aiInsights = pgTable("ai_insights", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	data: jsonb(),
	priority: text().default('medium').notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "ai_insights_tenant_id_tenants_id_fk"
		}),
]);

export const companies = pgTable("companies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	industry: text(),
	description: text(),
	website: text(),
	address: text(),
	phone: text(),
	email: text(),
	notes: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "companies_tenant_id_tenants_id_fk"
		}),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	email: text().notNull(),
	phone: text(),
	customerType: text("customer_type").default('individual').notNull(),
	companyId: uuid("company_id"),
	jobTitle: text("job_title"),
	department: text(),
	leadScore: integer("lead_score").default(0),
	status: text().default('lead').notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "customers_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: "customers_company_id_companies_id_fk"
		}),
]);

export const leadActivities = pgTable("lead_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadId: uuid("lead_id").notNull(),
	type: text().notNull(),
	body: text().notNull(),
	meta: jsonb(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "lead_activities_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_activities_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "lead_activities_created_by_users_id_fk"
		}),
]);

export const leads = pgTable("leads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	venueId: uuid("venue_id"),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text(),
	eventType: text("event_type").notNull(),
	guestCount: integer("guest_count").notNull(),
	dateStart: timestamp("date_start", { mode: 'string' }),
	dateEnd: timestamp("date_end", { mode: 'string' }),
	budgetMin: numeric("budget_min", { precision: 10, scale:  2 }),
	budgetMax: numeric("budget_max", { precision: 10, scale:  2 }),
	preferredContact: text("preferred_contact").default('email').notNull(),
	notes: text(),
	status: text().default('NEW').notNull(),
	sourceId: uuid("source_id"),
	utmSource: text("utm_source"),
	utmMedium: text("utm_medium"),
	utmCampaign: text("utm_campaign"),
	consentEmail: boolean("consent_email").default(true),
	consentSms: boolean("consent_sms").default(false),
	convertedCustomerId: uuid("converted_customer_id"),
	proposalId: uuid("proposal_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "leads_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "leads_venue_id_venues_id_fk"
		}),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [campaignSources.id],
			name: "leads_source_id_campaign_sources_id_fk"
		}),
	foreignKey({
			columns: [table.convertedCustomerId],
			foreignColumns: [customers.id],
			name: "leads_converted_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.proposalId],
			foreignColumns: [proposals.id],
			name: "leads_proposal_id_proposals_id_fk"
		}),
]);

export const packages = pgTable("packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	description: text(),
	category: text().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	pricingModel: text("pricing_model").default('fixed').notNull(),
	applicableSpaceIds: text("applicable_space_ids").array(),
	includedServiceIds: text("included_service_ids").array(),
	enabledTaxIds: text("enabled_tax_ids").array(),
	enabledFeeIds: text("enabled_fee_ids").array(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "packages_tenant_id_tenants_id_fk"
		}),
]);

export const leadTags = pgTable("lead_tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadId: uuid("lead_id").notNull(),
	tagId: uuid("tag_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "lead_tags_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_tags_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.tagId],
			foreignColumns: [tags.id],
			name: "lead_tags_tag_id_tags_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	bookingId: uuid("booking_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentType: text("payment_type").notNull(),
	paymentMethod: text("payment_method").notNull(),
	status: text().default('pending').notNull(),
	transactionId: text("transaction_id"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "payments_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "payments_booking_id_bookings_id_fk"
		}),
]);

export const contracts = pgTable("contracts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	customerId: uuid("customer_id").notNull(),
	contractName: text("contract_name").notNull(),
	status: text().default('draft').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "contracts_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "contracts_customer_id_customers_id_fk"
		}),
]);

export const leadTasks = pgTable("lead_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadId: uuid("lead_id").notNull(),
	title: text().notNull(),
	description: text(),
	dueAt: timestamp("due_at", { mode: 'string' }),
	assignedTo: uuid("assigned_to"),
	status: text().default('OPEN').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "lead_tasks_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "lead_tasks_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "lead_tasks_assigned_to_users_id_fk"
		}),
]);

export const settings = pgTable("settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	key: text().notNull(),
	value: jsonb().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "settings_tenant_id_tenants_id_fk"
		}),
]);

export const setupStyles = pgTable("setup_styles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	description: text(),
	iconName: text("icon_name"),
	category: text().default('general').notNull(),
	minCapacity: integer("min_capacity"),
	maxCapacity: integer("max_capacity"),
	floorPlan: jsonb("floor_plan"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "setup_styles_tenant_id_tenants_id_fk"
		}),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	title: text().notNull(),
	description: text(),
	assignedTo: uuid("assigned_to"),
	bookingId: uuid("booking_id"),
	dueDate: timestamp("due_date", { mode: 'string' }),
	priority: text().default('medium').notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tasks_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "tasks_assigned_to_users_id_fk"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "tasks_booking_id_bookings_id_fk"
		}),
]);

export const proposals = pgTable("proposals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	bookingId: uuid("booking_id"),
	customerId: uuid("customer_id"),
	title: text().notNull(),
	content: text().notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }),
	depositAmount: numeric("deposit_amount", { precision: 10, scale:  2 }),
	depositType: text("deposit_type").default('percentage'),
	depositValue: numeric("deposit_value", { precision: 5, scale:  2 }),
	packageId: uuid("package_id"),
	selectedServices: text("selected_services").array(),
	status: text().default('draft').notNull(),
	validUntil: timestamp("valid_until", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	viewedAt: timestamp("viewed_at", { mode: 'string' }),
	emailOpened: boolean("email_opened").default(false),
	emailOpenedAt: timestamp("email_opened_at", { mode: 'string' }),
	openCount: integer("open_count").default(0),
	signature: text(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	declinedAt: timestamp("declined_at", { mode: 'string' }),
	depositPaid: boolean("deposit_paid").default(false),
	depositPaidAt: timestamp("deposit_paid_at", { mode: 'string' }),
	paymentIntentId: text("payment_intent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	eventType: text("event_type"),
	eventDate: timestamp("event_date", { mode: 'string' }),
	startTime: text("start_time"),
	endTime: text("end_time"),
	guestCount: integer("guest_count"),
	venueId: uuid("venue_id"),
	spaceId: uuid("space_id"),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "proposals_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.bookingId],
			foreignColumns: [bookings.id],
			name: "proposals_booking_id_bookings_id_fk"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "proposals_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "proposals_venue_id_venues_id_fk"
		}),
	foreignKey({
			columns: [table.spaceId],
			foreignColumns: [spaces.id],
			name: "proposals_space_id_spaces_id_fk"
		}),
]);

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	description: text(),
	category: text().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	pricingModel: text("pricing_model").default('fixed').notNull(),
	enabledTaxIds: text("enabled_tax_ids").array(),
	enabledFeeIds: text("enabled_fee_ids").array(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "services_tenant_id_tenants_id_fk"
		}),
]);

export const subscriptionPackages = pgTable("subscription_packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	billingInterval: text("billing_interval").default('monthly').notNull(),
	maxVenues: integer("max_venues").default(1),
	maxUsers: integer("max_users").default(3),
	features: jsonb().default([]),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const spaces = pgTable("spaces", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	venueId: uuid("venue_id").notNull(),
	name: text().notNull(),
	description: text(),
	capacity: integer().notNull(),
	pricePerHour: numeric("price_per_hour", { precision: 10, scale:  2 }),
	amenities: text().array(),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "spaces_venue_id_venues_id_fk"
		}),
]);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: text().notNull(),
	color: text().default('#3b82f6').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tags_tenant_id_tenants_id_fk"
		}),
]);

export const tours = pgTable("tours", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	leadId: uuid("lead_id").notNull(),
	venueId: uuid("venue_id").notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }).notNull(),
	duration: integer().default(30).notNull(),
	status: text().default('SCHEDULED').notNull(),
	attendeeCount: integer("attendee_count").default(1),
	notes: text(),
	conductedBy: uuid("conducted_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "tours_tenant_id_tenants_id_fk"
		}),
	foreignKey({
			columns: [table.leadId],
			foreignColumns: [leads.id],
			name: "tours_lead_id_leads_id_fk"
		}),
	foreignKey({
			columns: [table.venueId],
			foreignColumns: [venues.id],
			name: "tours_venue_id_venues_id_fk"
		}),
	foreignKey({
			columns: [table.conductedBy],
			foreignColumns: [users.id],
			name: "tours_conducted_by_users_id_fk"
		}),
]);

export const tenants = pgTable("tenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	subscriptionPackageId: uuid("subscription_package_id").notNull(),
	status: text().default('active').notNull(),
	subscriptionStartedAt: timestamp("subscription_started_at", { mode: 'string' }),
	subscriptionEndsAt: timestamp("subscription_ends_at", { mode: 'string' }),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	logoUrl: text("logo_url"),
	primaryColor: text("primary_color").default('#3b82f6'),
	customCss: text("custom_css"),
	currentUsers: integer("current_users").default(0),
	currentVenues: integer("current_venues").default(0),
	monthlyBookings: integer("monthly_bookings").default(0),
	lastBillingDate: timestamp("last_billing_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.subscriptionPackageId],
			foreignColumns: [subscriptionPackages.id],
			name: "tenants_subscription_package_id_subscription_packages_id_fk"
		}),
	unique("tenants_slug_unique").on(table.slug),
]);
