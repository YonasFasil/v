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

export const spaces = pgTable("spaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").references(() => venues.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }),
  amenities: text("amenities").array(),
  imageUrl: text("image_url"),
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
  packageId: varchar("package_id").references(() => packages.id),
  selectedServices: text("selected_services").array(),
  pricingModel: text("pricing_model").default("fixed"),
  itemQuantities: jsonb("item_quantities"),
  pricingOverrides: jsonb("pricing_overrides"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  depositPaid: boolean("deposit_paid").default(false),
  isMultiDay: boolean("is_multi_day").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  customerId: varchar("customer_id").references(() => customers.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("draft"), // draft, sent, viewed, accepted, rejected, converted
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  // Additional fields to store event details for conversion
  eventType: text("event_type"),
  eventDate: timestamp("event_date"),
  startTime: text("start_time"), 
  endTime: text("end_time"),
  guestCount: integer("guest_count"),
  venueId: varchar("venue_id").references(() => venues.id),
  spaceId: varchar("space_id").references(() => spaces.id),
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
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertVenueSchema = createInsertSchema(venues).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingSchema = createInsertSchema(bookings, {
  eventDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ),
  endDate: z.union([z.string(), z.date()]).transform((val) => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
}).omit({ id: true, createdAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, sentAt: true, viewedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, processedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertAiInsightSchema = createInsertSchema(aiInsights).omit({ id: true, createdAt: true });
export const insertPackageSchema = createInsertSchema(packages).omit({ id: true, createdAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, createdAt: true });
export const insertSpaceSchema = createInsertSchema(spaces).omit({ id: true, createdAt: true });
export const insertTaxSettingSchema = createInsertSchema(taxSettings).omit({ id: true, createdAt: true });

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
export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type TaxSetting = typeof taxSettings.$inferSelect;
export type InsertTaxSetting = z.infer<typeof insertTaxSettingSchema>;
