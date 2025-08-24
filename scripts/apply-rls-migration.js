const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

async function applyRlsMigration() {
  console.log('🛡️  Applying RLS Migration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/003_enable_force_rls.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing RLS migration...');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ RLS migration applied successfully!');
    console.log('✅ Row-Level Security ENABLED and FORCED on all tenant tables');
    console.log('✅ Tenant isolation policies created');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyRlsMigration();