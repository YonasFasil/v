import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id), // null for super admin
  role: text("role").notNull().default("tenant_user"), // super_admin, tenant_admin, tenant_user
  permissions: jsonb("permissions").default('[]'), // Granular permissions array
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  stripeAccountId: text("stripe_account_id"), // Stripe Connect account ID
  stripeAccountStatus: text("stripe_account_status"), // pending, active, restricted, etc.
  stripeOnboardingCompleted: boolean("stripe_onboarding_completed").default(false),
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  stripeConnectedAt: timestamp("stripe_connected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  amenities: text("amenities").array(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const setupStyles = pgTable("setup_styles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  iconName: text("icon_name"), // Lucide icon name for UI display
  category: text("category").notNull().default("general"), // dining, meeting, presentation, social, custom
  minCapacity: integer("min_capacity"),
  maxCapacity: integer("max_capacity"),
  floorPlan: jsonb("floor_plan"), // 2D floor plan configuration showing the layout for this setup style
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const spaces = pgTable("spaces", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: uuid("venue_id").references(() => venues.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  amenities: text("amenities").array(),
  imageUrl: text("image_url"),
  availableSetupStyles: text("available_setup_styles").array(), // Available setup styles for this space (references setupStyles.id)
  floorPlan: jsonb("floor_plan"), // 2D floor plan configuration with elements, furniture, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Companies table for B2B organizations
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  industry: text("industry"),
  description: text("description"),
  website: text("website"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"), // Main company contact email
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  customerType: text("customer_type").notNull().default("individual"), // "individual" or "business"
  companyId: uuid("company_id").references(() => companies.id), // Link to company for business customers
  jobTitle: text("job_title"), // Position/title for business customers
  department: text("department"), // Department for business customers
  leadScore: integer("lead_score").default(0),
  status: text("status").notNull().default("lead"), // lead, customer, inactive
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract table to group multiple events together
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  contractName: text("contract_name").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  contractId: uuid("contract_id").references(() => contracts.id), // Link to contract
  eventName: text("event_name").notNull(),
  eventType: text("event_type").notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  venueId: uuid("venue_id").references(() => venues.id),
  spaceId: uuid("space_id").references(() => spaces.id),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"), // For multi-day events
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  guestCount: integer("guest_count").notNull(),
  setupStyle: text("setup_style"), // round-tables, u-shape, classroom, theater, cocktail, banquet, conference, custom
  packageId: uuid("package_id"),
  // Proposal integration
  proposalId: uuid("proposal_id"), // Direct link to proposal
  proposalStatus: text("proposal_status").default("none"), // none, sent, viewed, accepted, declined
  proposalSentAt: timestamp("proposal_sent_at"),
  proposalViewedAt: timestamp("proposal_viewed_at"),
  proposalRespondedAt: timestamp("proposal_responded_at"),
  selectedServices: text("selected_services").array(),
  pricingModel: text("pricing_model").default("fixed"),
  itemQuantities: jsonb("item_quantities"),
  pricingOverrides: jsonb("pricing_overrides"),
  taxFeeOverrides: jsonb("tax_fee_overrides"), // Legacy: Override taxes and fees for specific services/packages in this event
  serviceTaxOverrides: jsonb("service_tax_overrides"), // New: Per-service tax and fee overrides with inheritance control
  status: text("status").notNull().default("inquiry"), // inquiry, pending, tentative, confirmed_deposit_paid, confirmed_fully_paid, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").default(false),
  isMultiDay: boolean("is_multi_day").default(false),
  notes: text("notes"),
  // Cancellation tracking
  cancellationReason: text("cancellation_reason"), // Common reasons: client_request, venue_conflict, weather, insufficient_payment, etc.
  cancellationNote: text("cancellation_note"), // Additional details about cancellation
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  completedAt: timestamp("completed_at"), // Auto-set when event date passes and fully paid
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  customerId: uuid("customer_id").references(() => customers.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositType: text("deposit_type").default("percentage"), // percentage, fixed
  depositValue: decimal("deposit_value", { precision: 5, scale: 2 }),
  packageId: uuid("package_id"),
  selectedServices: text("selected_services").array(),
  status: text("status").notNull().default("draft"), // draft, sent, viewed, accepted, rejected, converted
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  emailOpened: boolean("email_opened").default(false),
  emailOpenedAt: timestamp("email_opened_at"),
  openCount: integer("open_count").default(0),
  signature: text("signature"), // Digital signature for acceptance
  acceptedAt: timestamp("accepted_at"),
  declinedAt: timestamp("declined_at"),
  depositPaid: boolean("deposit_paid").default(false),
  depositPaidAt: timestamp("deposit_paid_at"),
  paymentIntentId: text("payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  // Event details for conversion
  eventType: text("event_type"),
  eventDate: timestamp("event_date"),
  startTime: text("start_time"), 
  endTime: text("end_time"),
  guestCount: integer("guest_count"),
  venueId: uuid("venue_id").references(() => venues.id),
  spaceId: uuid("space_id").references(() => spaces.id),
});

// Settings table for deposit configuration
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication tracking
export const communications = pgTable("communications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  proposalId: uuid("proposal_id").references(() => proposals.id),
  customerId: uuid("customer_id").references(() => customers.id),
  type: text("type").notNull(), // email, sms, call, internal
  direction: text("direction").notNull(), // inbound, outbound
  subject: text("subject"),
  message: text("message").notNull(),
  sender: text("sender"), // Email sender address
  recipient: text("recipient"), // Email recipient address
  emailMessageId: text("email_message_id").unique(), // Unique email message ID for duplicate detection
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  status: text("status").default("sent"), // sent, delivered, read, failed, received
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull(), // deposit, final, refund
  paymentMethod: text("payment_method").notNull(), // card, bank_transfer, check
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  transactionId: text("transaction_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  bookingId: uuid("booking_id").references(() => bookings.id),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  type: text("type").notNull(), // recommendation, prediction, analysis
  title: text("title").notNull(),
  description: text("description").notNull(),
  data: jsonb("data"),
  priority: text("priority").notNull().default("medium"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // wedding, corporate, social, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  pricingModel: text("pricing_model").notNull().default("fixed"), // "fixed" or "per_person"
  applicableSpaceIds: text("applicable_space_ids").array(), // Which venues this applies to
  includedServiceIds: text("included_service_ids").array(), // Which services are included
  enabledTaxIds: text("enabled_tax_ids").array(), // Which taxes apply to this package
  enabledFeeIds: text("enabled_fee_ids").array(), // Which fees apply to this package
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // catering, entertainment, decor, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  pricingModel: text("pricing_model").notNull().default("fixed"), // "fixed" or "per_person"
  enabledTaxIds: text("enabled_tax_ids").array(), // Which taxes apply to this service
  enabledFeeIds: text("enabled_fee_ids").array(), // Which fees apply to this service
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tax and fees configuration
export const taxSettings = pgTable("tax_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'tax', 'fee', 'service_charge'
  calculation: text("calculation").notNull(), // 'percentage', 'fixed'
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  applyTo: text("apply_to").notNull(), // 'packages', 'services', 'both', 'total'
  isActive: boolean("is_active").default(true),
  isTaxable: boolean("is_taxable").default(false), // Whether this fee/charge is subject to tax
  applicableTaxIds: text("applicable_tax_ids").array(), // Array of tax IDs that apply to this fee
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead management system
export const campaignSources = pgTable("campaign_sources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  venueId: uuid("venue_id").references(() => venues.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  eventType: text("event_type").notNull(),
  guestCount: integer("guest_count").notNull(),
  dateStart: timestamp("date_start"),
  dateEnd: timestamp("date_end"),
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  preferredContact: text("preferred_contact").notNull().default("email"), // email, phone, sms
  notes: text("notes"),
  status: text("status").notNull().default("NEW"), // NEW, CONTACTED, TOUR_SCHEDULED, PROPOSAL_SENT, WON, LOST
  sourceId: uuid("source_id").references(() => campaignSources.id),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  consentEmail: boolean("consent_email").default(true),
  consentSms: boolean("consent_sms").default(false),
  convertedCustomerId: uuid("converted_customer_id").references(() => customers.id), // When lead converts to customer
  proposalId: uuid("proposal_id").references(() => proposals.id), // Link to sent proposal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadActivities = pgTable("lead_activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  type: text("type").notNull(), // NOTE, EMAIL, SMS, CALL, STATUS_CHANGE, TOUR_SCHEDULED
  body: text("body").notNull(),
  meta: jsonb("meta"), // Additional data like email template used, etc.
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leadTags = pgTable("lead_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  tagId: uuid("tag_id").references(() => tags.id).notNull(),
});

export const leadTasks = pgTable("lead_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueAt: timestamp("due_at"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  status: text("status").notNull().default("OPEN"), // OPEN, DONE
  createdAt: timestamp("created_at").defaultNow(),
});

export const tours = pgTable("tours", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  leadId: uuid("lead_id").references(() => leads.id).notNull(),
  venueId: uuid("venue_id").references(() => venues.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(30), // minutes
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
  attendeeCount: integer("attendee_count").default(1),
  notes: text("notes"),
  conductedBy: uuid("conducted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-tenant tables for SaaS functionality
export const subscriptionPackages = pgTable("subscription_packages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Starter", "Professional", "Enterprise"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingInterval: text("billing_interval").notNull().default("monthly"), // "monthly", "yearly"
  trialDays: integer("trial_days").default(14),
  maxVenues: integer("max_venues").default(1),
  maxUsers: integer("max_users").default(3),
  maxBookingsPerMonth: integer("max_bookings_per_month").default(100),
  features: jsonb("features").default('[]'), // Array of feature flags like ["advanced_analytics", "custom_branding"]
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly name for subdomains
  subdomain: text("subdomain").unique(), // e.g., "marriott"  
  customDomain: text("custom_domain"), // e.g., "bookings.marriott.com"
  subscriptionPackageId: uuid("subscription_package_id").references(() => subscriptionPackages.id).notNull(),
  status: text("status").notNull().default("trial"), // trial, active, suspended, cancelled
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionStartedAt: timestamp("subscription_started_at"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Branding options
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3b82f6"),
  customCss: text("custom_css"),
  // Usage tracking
  currentUsers: integer("current_users").default(0),
  currentVenues: integer("current_venues").default(0),
  monthlyBookings: integer("monthly_bookings").default(0),
  lastBillingDate: timestamp("last_billing_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertVenueSchema = createInsertSchema(venues).omit({ id: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, updatedAt: true });
export const insertCommunicationSchema = createInsertSchema(communications).omit({ id: true, sentAt: true });
export const insertBookingSchema = createInsertSchema(bookings, {
  eventDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
  proposalSentAt: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
  proposalViewedAt: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
  proposalRespondedAt: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
}).omit({ id: true, createdAt: true });
export const insertProposalSchema = createInsertSchema(proposals, {
  validUntil: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
  eventDate: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
}).omit({ id: true, createdAt: true, sentAt: true, viewedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, processedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({ id: true, createdAt: true });
export const insertPackageSchema = createInsertSchema(packages).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertSpaceSchema = createInsertSchema(spaces).omit({ id: true, createdAt: true });
export const insertSetupStyleSchema = createInsertSchema(setupStyles).omit({ id: true, createdAt: true });
export const insertTaxSettingSchema = createInsertSchema(taxSettings).omit({ id: true, createdAt: true });
export const insertCampaignSourceSchema = createInsertSchema(campaignSources).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertLeadSchema = createInsertSchema(leads, {
  dateStart: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
  dateEnd: z.union([z.string(), z.date(), z.null()]).transform((val) => 
    val === null ? null : (typeof val === 'string' ? new Date(val) : val)
  ).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({ id: true, createdAt: true });
export const insertLeadTaskSchema = createInsertSchema(leadTasks).omit({ id: true, createdAt: true });
export const insertTourSchema = createInsertSchema(tours).omit({ id: true, createdAt: true });
export const insertSubscriptionPackageSchema = createInsertSchema(subscriptionPackages).omit({ id: true, createdAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;


export type InsertUser = z.infer<typeof insertUserSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type SetupStyle = typeof setupStyles.$inferSelect;
export type InsertSetupStyle = z.infer<typeof insertSetupStyleSchema>;
export type TaxSetting = typeof taxSettings.$inferSelect;
export type InsertTaxSetting = z.infer<typeof insertTaxSettingSchema>;
export type CampaignSource = typeof campaignSources.$inferSelect;
export type InsertCampaignSource = z.infer<typeof insertCampaignSourceSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadTask = typeof leadTasks.$inferSelect;
export type InsertLeadTask = z.infer<typeof insertLeadTaskSchema>;
export type Tour = typeof tours.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type SubscriptionPackage = typeof subscriptionPackages.$inferSelect;
export type InsertSubscriptionPackage = z.infer<typeof insertSubscriptionPackageSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

// Add foreign key references after all tables are defined to avoid circular dependencies
export const bookingsRelations = {
  packageId: {
    foreignKey: () => packages.id
  },
  proposalId: {
    foreignKey: () => proposals.id
  }
};

export const proposalsRelations = {
  packageId: {
    foreignKey: () => packages.id
  }
};
