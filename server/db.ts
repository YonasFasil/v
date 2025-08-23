import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = process.env.DATABASE_URL;

// Check if using local PostgreSQL or Neon
let db;

if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
  // Local PostgreSQL using node-postgres
  const pool = new Pool({
    connectionString: databaseUrl,
  });
  
  db = drizzleNode(pool, { 
    schema,
    logger: process.env.NODE_ENV === 'development' 
  });
} else {
  // Remote Neon database using neon-http
  const sql = neon(databaseUrl);
  db = drizzleNeon(sql, { 
    schema,
    logger: process.env.NODE_ENV === 'development' 
  });
}

export { db };
