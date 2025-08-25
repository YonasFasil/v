const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

async function applyAdminAudit() {
  console.log('🔐 Applying Admin Audit Migration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/005_admin_audit.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing admin audit migration...');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Admin audit migration applied successfully!');
    console.log('✅ admin_audit table created');
    console.log('✅ RLS policies applied');
    console.log('✅ Audit trail ready for super-admin assumptions');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyAdminAudit();