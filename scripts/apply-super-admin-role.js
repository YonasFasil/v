const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

async function applySuperAdminRole() {
  console.log('👑 Applying Super-Admin Role Migration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/006_super_admin_role.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing super-admin role migration...');
    
    // Execute the migration
    await pool.query(migrationSql);
    
    console.log('✅ Super-admin role migration applied successfully!');
    console.log('✅ venuine_super_admin role created');
    console.log('✅ Elevated permissions granted for super-admin operations');
    console.log('✅ RLS enforcement maintained for tenant isolation');
    console.log('✅ Role switching capability enabled');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySuperAdminRole();