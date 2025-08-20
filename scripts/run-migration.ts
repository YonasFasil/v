/**
 * Migration runner script
 * This script runs the tenant isolation migration
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  
  try {
    console.log('🚀 Starting tenant isolation migration...');
    
    // Read migration file
    const migrationPath = join(__dirname, '../migrations/001_add_tenant_isolation.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} migration statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await db.execute(sql.raw(statement));
        console.log(`✅ Statement ${i + 1} completed`);
      } catch (error) {
        console.error(`❌ Statement ${i + 1} failed:`, error);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('🔒 Tenant isolation is now active at database level');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    // No need to end connection with Drizzle db instance
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💀 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigration };