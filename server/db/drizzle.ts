// Clean Drizzle ORM setup for Neon
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create Neon Pool client
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

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

// Export common Drizzle operators
export { eq, and, or, not, isNull, isNotNull, desc, asc, like, ilike, inArray } from "drizzle-orm";

export default db;