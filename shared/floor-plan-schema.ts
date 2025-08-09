import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  pgTable,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const floorPlans = pgTable("floor_plans", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  name: varchar("name").notNull(),
  description: text("description"),
  setupStyle: varchar("setup_style").notNull(),
  venueId: varchar("venue_id").notNull(),
  planData: jsonb("plan_data").notNull(),
  totalSeats: integer("total_seats").default(0),
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type FloorPlan = typeof floorPlans.$inferSelect;
export const insertFloorPlanSchema = createInsertSchema(floorPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertFloorPlan = z.infer<typeof insertFloorPlanSchema>;