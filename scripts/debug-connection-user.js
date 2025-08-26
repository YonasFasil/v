const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugConnectionUser() {
  console.log('🔍 Debugging database connection and user...\n');
  
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    // Check current user and connection details
    const currentUser = await pool.query('SELECT current_user, session_user, current_database()');
    console.log('Current user:', currentUser.rows[0].current_user);
    console.log('Session user:', currentUser.rows[0].session_user);
    console.log('Current database:', currentUser.rows[0].current_database);
    
    // Check if venuine_app role exists
    const roleCheck = await pool.query(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = 'venuine_app'
    `);
    
    console.log('\n🔍 venuine_app role status:');
    if (roleCheck.rows.length > 0) {
      console.log('✅ venuine_app role exists');
      console.log(`   Super: ${roleCheck.rows[0].rolsuper}`);
      console.log(`   Bypass RLS: ${roleCheck.rows[0].rolbypassrls}`);
    } else {
      console.log('❌ venuine_app role does not exist');
    }
    
    // Check permissions on tenants table
    const permissions = await pool.query(`
      SELECT grantee, privilege_type 
      FROM information_schema.table_privileges 
      WHERE table_name = 'tenants' AND grantee = 'venuine_app'
    `);
    
    console.log('\n📋 venuine_app permissions on tenants table:');
    if (permissions.rows.length > 0) {
      permissions.rows.forEach(row => {
        console.log(`   ${row.privilege_type}`);
      });
    } else {
      console.log('❌ No permissions found for venuine_app on tenants table');
    }
    
    // Test switching to venuine_app role
    console.log('\n🔄 Testing role switching...');
    try {
      await pool.query('SET ROLE venuine_app');
      console.log('✅ Successfully switched to venuine_app');
      
      const newUser = await pool.query('SELECT current_user');
      console.log(`   Current user after switch: ${newUser.rows[0].current_user}`);
      
      await pool.query('RESET ROLE');
      console.log('✅ Successfully reset role');
    } catch (error) {
      console.log('❌ Role switching failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugConnectionUser();