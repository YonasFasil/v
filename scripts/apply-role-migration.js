const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

async function applyRoleMigration() {
  console.log('🔒 Applying Database Role Security Migration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('migrations/002_lockdown_roles.sql', 'utf8');
    
    console.log('📄 Executing role lockdown migration...');
    
    // Execute the migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the roles were created
    console.log('\n🔍 Verifying role creation...');
    
    const roleCheck = await pool.query(`
      SELECT 
        rolname, 
        rolsuper, 
        rolbypassrls, 
        rolcreatedb, 
        rolcreaterole,
        rolconnlimit
      FROM pg_roles 
      WHERE rolname IN ('venuine_app', 'venuine_owner')
      ORDER BY rolname
    `);
    
    console.log('📋 Created Roles:');
    roleCheck.rows.forEach(role => {
      console.log(`\n👤 ${role.rolname}:`);
      console.log(`   - Superuser: ${role.rolsuper ? '❌ YES' : '✅ NO'}`);
      console.log(`   - Bypass RLS: ${role.rolbypassrls ? '❌ YES' : '✅ NO'}`);
      console.log(`   - Create DB: ${role.rolcreatedb ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Create Role: ${role.rolcreaterole ? '✅ YES' : '❌ NO'}`);
      console.log(`   - Connection Limit: ${role.rolconnlimit}`);
    });
    
    // Check table ownership
    console.log('\n🏗️  Checking table ownership...');
    const ownershipCheck = await pool.query(`
      SELECT tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      LIMIT 5
    `);
    
    ownershipCheck.rows.forEach(table => {
      const status = table.tableowner === 'venuine_owner' ? '✅' : '⚠️';
      console.log(`   ${status} ${table.tablename}: owned by ${table.tableowner}`);
    });
    
    console.log('\n🎉 Database role security hardening complete!');
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Update production connection strings to use venuine_app role');
    console.log('2. Use venuine_owner role for future migrations');
    console.log('3. Test application functionality with restricted role');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Show more details for common errors
    if (error.message.includes('role') && error.message.includes('already exists')) {
      console.log('\n💡 Note: Some roles may already exist. This is usually safe.');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyRoleMigration();