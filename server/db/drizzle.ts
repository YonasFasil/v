
// Clean Drizzle ORM setup for Neon with neon-http driver
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export all schema tables for easy access
export {
  users,
  venues,
  spaces,
  setupStyles,
  companies,
  customers,
  contracts,
  bookings,
  eventSpaces,
  proposals,
  payments,
  tasks,
  packages,
  services,
  settings,
  communications,
  taxSettings,
  campaignSources,
  tags,
  leads,
  leadActivities,
  leadTasks,
  tours,
  tenants,
  subscriptionPackages,
  aiInsights
} from "../../shared/schema";

// Export common Drizzle operators and sql helper
export { eq, and, or, not, isNull, isNotNull, desc, asc, like, ilike, inArray, sql } from "drizzle-orm";

export default db;
