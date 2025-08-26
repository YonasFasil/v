const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function applyGrantsAsSuperuser() {
  console.log('🔐 Applying grants as superuser (postgres)...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Ensuring we are connected as postgres superuser...');
    const currentUser = await pool.query('SELECT current_user');
    console.log(`   Current user: ${currentUser.rows[0].current_user}`);
    
    if (currentUser.rows[0].current_user !== 'postgres') {
      throw new Error('Must be connected as postgres superuser to grant permissions');
    }
    
    console.log('\n2️⃣ Applying minimal safe GRANTs to venuine_app...');
    
    // Allow the app to access objects in the schema
    await pool.query('GRANT USAGE ON SCHEMA public TO venuine_app');
    console.log('   ✅ Schema usage granted');
    
    // Allow the app to CRUD only the tables it actually uses
    await pool.query(`
      GRANT SELECT, INSERT, UPDATE, DELETE ON
        tenants,
        users,
        customers,
        events,
        bookings,
        proposals,
        venues,
        spaces,
        companies,
        contracts,
        packages,
        services,
        payments,
        tasks,
        settings,
        tags,
        subscription_packages
      TO venuine_app
    `);
    console.log('   ✅ Table CRUD permissions granted');
    
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
    
    console.log('\n3️⃣ Verifying permissions...');
    
    const permissions = await pool.query(`
      SELECT grantee, table_name, privilege_type 
      FROM information_schema.table_privileges 
      WHERE grantee = 'venuine_app' AND table_name IN ('tenants', 'users')
      ORDER BY table_name, privilege_type
    `);
    
    console.log('   Permissions for venuine_app:');
    permissions.rows.forEach(row => {
      console.log(`     ${row.table_name}: ${row.privilege_type}`);
    });
    
    console.log('\n✅ All grants applied successfully!');
    console.log('   Now the super admin should be able to create tenants.');
    
  } catch (error) {
    console.error('❌ Failed to apply grants:', error.message);
  } finally {
    await pool.end();
  }
}

applyGrantsAsSuperuser();