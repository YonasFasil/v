const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function applyGrantsExistingTables() {
  console.log('🔐 Applying grants for existing tables only...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Finding existing tables...');
    
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('   Existing tables:');
    tables.rows.forEach(row => {
      console.log(`     - ${row.tablename}`);
    });
    
    console.log('\n2️⃣ Applying grants to existing tables...');
    
    // Allow the app to access objects in the schema
    await pool.query('GRANT USAGE ON SCHEMA public TO venuine_app');
    console.log('   ✅ Schema usage granted');
    
    // Grant permissions to each existing table
    for (const table of tables.rows) {
      try {
        await pool.query(`
          GRANT SELECT, INSERT, UPDATE, DELETE ON ${table.tablename} TO venuine_app
        `);
        console.log(`   ✅ Permissions granted for ${table.tablename}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to grant permissions for ${table.tablename}: ${error.message}`);
      }
    }
    
    // Sequences (needed for IDENTITY/SERIAL nextval/currval)
    await pool.query('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO venuine_app');
    console.log('   ✅ Sequence permissions granted');
    
    // Default privileges so new tables/sequences also work
    await pool.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO venuine_app
    `);
    console.log('   ✅ Default table privileges granted');
    
    await pool.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO venuine_app
    `);
    console.log('   ✅ Default sequence privileges granted');
    
    console.log('\n3️⃣ Verifying key permissions...');
    
    const permissions = await pool.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE grantee = 'venuine_app' AND table_name IN ('tenants', 'users')
      ORDER BY table_name, privilege_type
    `);
    
    console.log('   Critical permissions for venuine_app:');
    permissions.rows.forEach(row => {
      console.log(`     ${row.table_name}: ${row.privilege_type}`);
    });
    
    console.log('\n✅ All grants applied successfully to existing tables!');
    
  } catch (error) {
    console.error('❌ Failed to apply grants:', error.message);
  } finally {
    await pool.end();
  }
}

applyGrantsExistingTables();