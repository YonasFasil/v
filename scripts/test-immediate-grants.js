const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testImmediateGrants() {
  console.log('🔍 Testing with grants in same transaction...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing as postgres superuser first...');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verify we're postgres
      const currentUser = await client.query('SELECT current_user');
      console.log(`   Current user: ${currentUser.rows[0].current_user}`);
      
      // Test INSERT as postgres
      const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
      const packageId = packageResult.rows[0]?.id;
      
      const postgresResult = await client.query(`
        INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
        VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
        RETURNING *
      `, ['Postgres Test', 'postgres-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
      
      console.log('   ✅ INSERT as postgres succeeded');
      console.log(`   Created: ${postgresResult.rows[0].name}`);
      
      // Clean up
      await client.query('DELETE FROM tenants WHERE slug = $1', ['postgres-test']);
      
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    
    console.log('\n2️⃣ Now testing the real issue - connecting as venuine_app from start...');
    
    // Create a connection string that connects directly as venuine_app
    const originalUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb";
    const venuineAppUrl = originalUrl.replace('postgres:password', 'venuine_app:password');
    
    console.log('   Trying to connect directly as venuine_app...');
    
    try {
      const appPool = new Pool({ connectionString: venuineAppUrl });
      const appClient = await appPool.connect();
      
      try {
        const appUser = await appClient.query('SELECT current_user');
        console.log(`   Connected as: ${appUser.rows[0].current_user}`);
        
        await appClient.query('BEGIN');
        await appClient.query(`SET LOCAL app.user_role = 'super_admin'`);
        
        const appResult = await appClient.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING *
        `, ['App Test', 'app-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log('   ✅ INSERT as venuine_app succeeded!');
        console.log(`   Created: ${appResult.rows[0].name}`);
        
        // Cleanup
        await appClient.query('DELETE FROM tenants WHERE slug = $1', ['app-test']);
        await appClient.query('COMMIT');
        
      } catch (appError) {
        await appClient.query('ROLLBACK');
        console.log(`   ❌ INSERT as venuine_app failed: ${appError.message}`);
      } finally {
        appClient.release();
        await appPool.end();
      }
      
    } catch (connError) {
      console.log(`   ❌ Could not connect as venuine_app: ${connError.message}`);
      
      console.log('\n3️⃣ The problem might be that venuine_app role has no login privilege...');
      
      // Check if venuine_app can login
      const roleInfo = await pool.query(`
        SELECT 
          rolname,
          rolcanlogin,
          rolsuper,
          rolbypassrls
        FROM pg_roles 
        WHERE rolname = 'venuine_app'
      `);
      
      console.log('   venuine_app role info:');
      if (roleInfo.rows.length > 0) {
        const role = roleInfo.rows[0];
        console.log(`     Can login: ${role.rolcanlogin}`);
        console.log(`     Superuser: ${role.rolsuper}`);
        console.log(`     Bypass RLS: ${role.rolbypassrls}`);
        
        if (!role.rolcanlogin) {
          console.log('\n   🎯 FOUND THE ISSUE! venuine_app cannot login.');
          console.log('   That means our app must connect as postgres and use SET ROLE.');
          console.log('   But SET ROLE seems to be causing "permission denied for schema public".');
          console.log('   This suggests there might be a config issue with the role grants.');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testImmediateGrants();