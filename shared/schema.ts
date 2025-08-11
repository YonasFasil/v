import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("manager"),
  stripeAccountId: text("stripe_account_id"), // Stripe Connect account ID
  stripeAccountStatus: text("stripe_account_status"), // pending, active, restricted, etc.
  stripeOnboardingCompleted: boolean("stripe_onboarding_completed").default(false),
  stripeChargesEnabled: boolean("stripe_charges_enabled").default(false),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false),
  stripeConnectedAt: timestamp("stripe_connected_at"),
});

export const venues = pgTable("venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  amenities: text("amenities").array(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
});

export const setupStyles = pgTable("setup_styles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").references(() => venues.id).notNull(),
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

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  leadScore: integer("lead_score").default(0),
  status: text("status").notNull().default("lead"), // lead, customer, inactive
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract table to group multiple events together
export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  contractName: text("contract_name").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").references(() => contracts.id), // Link to contract
  eventName: text("event_name").notNull(),
  eventType: text("event_type").notNull(),
  customerId: varchar("customer_id").references(() => customers.id),
  venueId: varchar("venue_id").references(() => venues.id),
  spaceId: varchar("space_id").references(() => spaces.id),
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"), // For multi-day events
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  guestCount: integer("guest_count").notNull(),
  setupStyle: text("setup_style"), // round-tables, u-shape, classroom, theater, cocktail, banquet, conference, custom
  packageId: varchar("package_id").references(() => packages.id),
  // Proposal integration
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
  status: text("status").notNull().default("inquiry"), // inquiry, pending, confirmed_unpaid, confirmed_deposit_paid, confirmed_fully_paid, completed, cancelled_refunded
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").default(false),
  isMultiDay: boolean("is_multi_day").default(false),
  notes: text("notes"),
  // Cancellation tracking
  cancellationReason: text("cancellation_reason"), // Common reasons: client_request, venue_conflict, weather, insufficient_payment, etc.
  cancellationNote: text("cancellation_note"), // Additional details about cancellation
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: varchar("cancelled_by").references(() => users.id),
  completedAt: timestamp("completed_at"), // Auto-set when event date passes and fully paid
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").references(() => customers.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositType: text("deposit_type").default("percentage"), // percentage, fixed
  depositValue: decimal("deposit_value", { precision: 5, scale: 2 }),
  packageId: varchar("package_id").references(() => packages.id),
  selectedServices: text("selected_services").array(),
  status: text("status").notNull().default("draft"), // draft, sent, viewed, accepted, rejected, converted
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  emailOpened: boolean("email_opened").default(false),
  emailOpenedAt: timestamp("email_opened_at"),
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
  venueId: varchar("venue_id").references(() => venues.id),
  spaceId: varchar("space_id").references(() => spaces.id),
});

// Settings table for deposit configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Communication tracking
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").references(() => customers.id),
  type: text("type").notNull(), // email, sms, call, internal
  direction: text("direction").notNull(), // inbound, outbound
  subject: text("subject"),
  message: text("message").notNull(),
  sentBy: text("sent_by"),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  status: text("status").default("sent"), // sent, delivered, read, failed
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull(), // deposit, final, refund
  paymentMethod: text("payment_method").notNull(), // card, bank_transfer, check
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  transactionId: text("transaction_id"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // recommendation, prediction, analysis
  title: text("title").notNull(),
  description: text("description").notNull(),
  data: jsonb("data"),
  priority: text("priority").notNull().default("medium"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const packages = pgTable("packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").references(() => venues.id),
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
  sourceId: varchar("source_id").references(() => campaignSources.id),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  consentEmail: boolean("consent_email").default(true),
  consentSms: boolean("consent_sms").default(false),
  convertedCustomerId: varchar("converted_customer_id").references(() => customers.id), // When lead converts to customer
  proposalId: varchar("proposal_id").references(() => proposals.id), // Link to sent proposal
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadActivities = pgTable("lead_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  type: text("type").notNull(), // NOTE, EMAIL, SMS, CALL, STATUS_CHANGE, TOUR_SCHEDULED
  body: text("body").notNull(),
  meta: jsonb("meta"), // Additional data like email template used, etc.
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leadTags = pgTable("lead_tags", {
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  tagId: varchar("tag_id").references(() => tags.id).notNull(),
});

export const leadTasks = pgTable("lead_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueAt: timestamp("due_at"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  status: text("status").notNull().default("OPEN"), // OPEN, DONE
  createdAt: timestamp("created_at").defaultNow(),
});

export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  venueId: varchar("venue_id").references(() => venues.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(30), // minutes
  status: text("status").notNull().default("SCHEDULED"), // SCHEDULED, COMPLETED, CANCELLED, NO_SHOW
  attendeeCount: integer("attendee_count").default(1),
  notes: text("notes"),
  conductedBy: varchar("conducted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertVenueSchema = createInsertSchema(venues).omit({ id: true });
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

// Types
export type User = typeof users.$inferSelect;


export type InsertUser = z.infer<typeof insertUserSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
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
