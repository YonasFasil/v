const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkSuperAdminUsers() {
  console.log('🔍 Checking super admin users in database...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Looking for super admin users:');
    
    const superAdmins = await pool.query(`
      SELECT id, username, email, name, role, tenant_id, is_active
      FROM users 
      WHERE role = 'super_admin'
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${superAdmins.rows.length} super admin users:`);
    superAdmins.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`     Role: ${user.role}, Active: ${user.is_active}`);
      console.log(`     Tenant ID: ${user.tenant_id || 'NULL'}`);
    });
    
    console.log('\n2️⃣ Looking for any admin users:');
    
    const admins = await pool.query(`
      SELECT id, username, email, name, role, tenant_id, is_active
      FROM users 
      WHERE role LIKE '%admin%'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${admins.rows.length} admin users:`);
    admins.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      console.log(`     Active: ${user.is_active}, Tenant: ${user.tenant_id}`);
    });
    
    console.log('\n3️⃣ Testing with a regular tenant admin:');
    
    const tenantAdmins = await pool.query(`
      SELECT u.id, u.username, u.email, u.name, u.role, u.tenant_id, u.is_active,
             t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.role = 'tenant_admin' AND u.is_active = true
      ORDER BY u.created_at DESC
      LIMIT 3
    `);
    
    console.log(`Found ${tenantAdmins.rows.length} active tenant admin users:`);
    tenantAdmins.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`     Tenant: ${user.tenant_name} (${user.tenant_id})`);
    });
    
    // Try login with first tenant admin
    if (tenantAdmins.rows.length > 0) {
      const testUser = tenantAdmins.rows[0];
      console.log(`\n4️⃣ Credentials to try for testing:`);
      console.log(`Email: ${testUser.email}`);
      console.log(`Tenant: ${testUser.tenant_name}`);
      console.log(`User ID: ${testUser.id}`);
      
      // Check if this user has venues and spaces
      const userVenues = await pool.query(`
        SELECT COUNT(*) as venue_count FROM venues WHERE tenant_id = $1
      `, [testUser.tenant_id]);
      
      const userSpaces = await pool.query(`
        SELECT COUNT(*) as space_count 
        FROM spaces s 
        JOIN venues v ON v.id = s.venue_id 
        WHERE v.tenant_id = $1
      `, [testUser.tenant_id]);
      
      console.log(`This tenant has ${userVenues.rows[0].venue_count} venues and ${userSpaces.rows[0].space_count} spaces`);
    }
    
    console.log('\n💡 To test the spaces issue:');
    console.log('1. Use one of the tenant admin credentials above');
    console.log('2. Login via your frontend');
    console.log('3. Check if spaces show up');
    console.log('4. Check browser DevTools → Network tab for /api/spaces request');
    console.log('5. Verify Authorization header is present');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkSuperAdminUsers();