const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testStepByStep() {
  console.log('🔍 Testing step by step to isolate the issue...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing basic connection and role switch...');
    
    const client = await pool.connect();
    
    try {
      // Check initial user
      const initialUser = await client.query('SELECT current_user');
      console.log(`   Initial user: ${initialUser.rows[0].current_user}`);
      
      // Begin transaction
      await client.query('BEGIN');
      console.log('   ✅ Transaction started');
      
      // Switch to the app role
      await client.query('SET ROLE venuine_app');
      console.log('   ✅ Switched to venuine_app role');
      
      const currentUser = await client.query('SELECT current_user');
      console.log(`   Current user: ${currentUser.rows[0].current_user}`);
      
      // Set session variables
      await client.query(`SET LOCAL app.user_role = 'super_admin'`);
      console.log('   ✅ Set user role to super_admin');
      
      console.log('\n2️⃣ Testing simple SELECT first...');
      try {
        const selectTest = await client.query('SELECT COUNT(*) FROM tenants');
        console.log(`   ✅ SELECT works - found ${selectTest.rows[0].count} tenants`);
      } catch (error) {
        console.log('   ❌ SELECT failed:', error.message);
        throw error;
      }
      
      console.log('\n3️⃣ Testing INSERT with explicit values (no sequences)...');
      try {
        // Get a subscription package ID first
        const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
        const packageId = packageResult.rows[0]?.id;
        
        if (!packageId) {
          throw new Error('No subscription packages found');
        }
        
        console.log(`   Using package ID: ${packageId}`);
        
        // Try INSERT with a manual ID to avoid sequence issues
        const testInsert = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *
        `, ['Step Test Tenant', 'step-test-tenant', packageId, 'active']);
        
        console.log('   ✅ INSERT works!');
        console.log(`   Created tenant: ${testInsert.rows[0].name} (ID: ${testInsert.rows[0].id})`);
        
        // Cleanup immediately
        await client.query('DELETE FROM tenants WHERE slug = $1', ['step-test-tenant']);
        console.log('   ✅ Cleanup successful');
        
      } catch (error) {
        console.log('   ❌ INSERT failed:', error.message);
        throw error;
      }
      
      await client.query('COMMIT');
      console.log('\n🎉 All steps successful!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      try {
        await client.query('RESET ROLE');
      } catch (error) {
        console.warn('Warning: Could not reset role:', error.message);
      }
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Step-by-step test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testStepByStep();