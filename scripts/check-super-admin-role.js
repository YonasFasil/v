const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkSuperAdminRole() {
  console.log('👑 Checking super-admin role configuration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    // Check if super-admin role exists
    const roleCheck = await pool.query(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname = 'venuine_super_admin'
    `);
    
    console.log('🔍 Super-admin role status:');
    if (roleCheck.rows.length > 0) {
      console.log('✅ venuine_super_admin role exists');
      console.log(`   Super: ${roleCheck.rows[0].rolsuper}`);
      console.log(`   Bypass RLS: ${roleCheck.rows[0].rolbypassrls}`);
    } else {
      console.log('❌ venuine_super_admin role does not exist');
    }
    
    // Check role membership
    const membershipCheck = await pool.query(`
      SELECT r.rolname as role_name, m.rolname as member_of
      FROM pg_roles r
      JOIN pg_auth_members am ON am.roleid = r.oid
      JOIN pg_roles m ON am.member = m.oid
      WHERE m.rolname = 'venuine_super_admin'
    `);
    
    console.log('\n🔗 Role membership:');
    if (membershipCheck.rows.length > 0) {
      membershipCheck.rows.forEach(row => {
        console.log(`   ${row.role_name} is member of ${row.member_of}`);
      });
    } else {
      console.log('❌ No roles are members of venuine_super_admin');
    }
    
    // Check permissions on key tables
    const permissionsCheck = await pool.query(`
      SELECT schemaname, tablename, privilege_type, grantee
      FROM information_schema.table_privileges
      WHERE grantee = 'venuine_super_admin'
      AND schemaname = 'public'
      ORDER BY tablename, privilege_type
    `);
    
    console.log('\n📋 Table permissions for venuine_super_admin:');
    if (permissionsCheck.rows.length > 0) {
      permissionsCheck.rows.forEach(row => {
        console.log(`   ${row.tablename}: ${row.privilege_type}`);
      });
    } else {
      console.log('❌ No table permissions found for venuine_super_admin');
    }
    
    // Test role switching
    console.log('\n🔄 Testing role switching...');
    try {
      await pool.query('SET ROLE venuine_super_admin');
      console.log('✅ Successfully switched to venuine_super_admin');
      
      const currentRole = await pool.query('SELECT current_user');
      console.log(`   Current user: ${currentRole.rows[0].current_user}`);
      
      await pool.query('RESET ROLE');
      console.log('✅ Successfully reset role');
    } catch (error) {
      console.log('❌ Role switching failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking super-admin role:', error.message);
  } finally {
    await pool.end();
  }
}

checkSuperAdminRole();