const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

async function applyTenantConstraints() {
  console.log('🛡️  Applying Tenant Constraints Migration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/004_tenant_constraints.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing tenant constraints migration...');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Tenant constraints migration applied successfully!');
    console.log('✅ Per-tenant unique indexes created');
    console.log('✅ Cross-tenant FK protection added');
    console.log('✅ Constraint monitoring view created');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyTenantConstraints();