const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testMinimalInsertNoTransaction() {
  console.log('🎯 Testing minimal INSERT without transaction to get clean error...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    // Get package ID first
    const packageResult = await pool.query('SELECT id FROM subscription_packages LIMIT 1');
    const packageId = packageResult.rows[0]?.id;
    
    if (!packageId) {
      throw new Error('No subscription packages found');
    }
    console.log(`Using package ID: ${packageId}`);
    
    console.log('\n1️⃣ Testing absolute minimal INSERT...');
    
    try {
      const result = await pool.query(`
        INSERT INTO tenants (name, slug, subscription_package_id) 
        VALUES ($1, $2, $3)
        RETURNING id, name
      `, ['Minimal Clean Test', 'minimal-clean-test', packageId]);
      
      console.log(`✅ SUCCESS! INSERT worked: ${result.rows[0].name} (${result.rows[0].id})`);
      
      // Clean up
      await pool.query('DELETE FROM tenants WHERE id = $1', [result.rows[0].id]);
      console.log('✅ Cleanup successful');
      
      console.log('\n🎉 THE INSERT ACTUALLY WORKS!');
      console.log('The issue was probably with our testing approach or transaction state.');
      
    } catch (insertError) {
      console.log(`❌ INSERT failed: ${insertError.message}`);
      console.log(`Error code: ${insertError.code}`);
      console.log(`Error detail: ${insertError.detail}`);
      console.log(`Error hint: ${insertError.hint}`);
      
      // Let's check if it's a constraint issue
      if (insertError.code === '23505') {
        console.log('\n🎯 DUPLICATE KEY ERROR - trying with different slug...');
        
        try {
          const uuid = crypto.randomUUID().substring(0, 8);
          const result2 = await pool.query(`
            INSERT INTO tenants (name, slug, subscription_package_id) 
            VALUES ($1, $2, $3)
            RETURNING id, name
          `, [`Unique Test ${uuid}`, `unique-test-${uuid}`, packageId]);
          
          console.log(`✅ SUCCESS with unique slug: ${result2.rows[0].name}`);
          await pool.query('DELETE FROM tenants WHERE id = $1', [result2.rows[0].id]);
          
        } catch (uniqueError) {
          console.log(`❌ Still failed with unique slug: ${uniqueError.message}`);
        }
      }
    }
    
    console.log('\n2️⃣ Let me also test the exact super admin tenant creation pattern...');
    
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET ROLE venuine_app');
        await client.query(`SET LOCAL app.user_role = 'super_admin'`);
        
        const tenantResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING *
        `, ['Super Admin Test', 'super-admin-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log(`✅ SUCCESS! Super admin pattern works: ${tenantResult.rows[0].name}`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [tenantResult.rows[0].id]);
        await client.query('COMMIT');
        
        console.log('\n🎉 SUPER ADMIN TENANT CREATION NOW WORKS!');
        console.log('The issue has been resolved by applying the grants.');
        
      } catch (superAdminError) {
        await client.query('ROLLBACK');
        console.log(`❌ Super admin pattern failed: ${superAdminError.message}`);
      } finally {
        await client.query('RESET ROLE');
        client.release();
      }
    } catch (connectionError) {
      console.log(`❌ Connection error: ${connectionError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testMinimalInsertNoTransaction();