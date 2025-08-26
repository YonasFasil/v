const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function pinpointPermissionError() {
  console.log('🎯 Pinpointing exactly where permission denied occurs...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing step-by-step operations as postgres...');
    
    const client = await pool.connect();
    try {
      // Verify we're postgres superuser
      const user = await client.query('SELECT current_user, session_user');
      console.log(`   Connected as: ${user.rows[0].current_user} (session: ${user.rows[0].session_user})`);
      
      console.log('\n2️⃣ Testing transaction BEGIN...');
      await client.query('BEGIN');
      console.log('   ✅ BEGIN succeeded');
      
      console.log('\n3️⃣ Testing simple SELECT...');
      const selectResult = await client.query('SELECT COUNT(*) FROM tenants');
      console.log(`   ✅ SELECT succeeded - ${selectResult.rows[0].count} rows`);
      
      console.log('\n4️⃣ Testing function calls...');
      try {
        const uuid = await client.query('SELECT gen_random_uuid()');
        console.log(`   ✅ gen_random_uuid() works: ${uuid.rows[0].gen_random_uuid}`);
      } catch (uuidError) {
        console.log(`   ❌ gen_random_uuid() failed: ${uuidError.message}`);
      }
      
      try {
        const now = await client.query('SELECT NOW()');
        console.log(`   ✅ NOW() works: ${now.rows[0].now}`);
      } catch (nowError) {
        console.log(`   ❌ NOW() failed: ${nowError.message}`);
      }
      
      console.log('\n5️⃣ Testing subscription_packages SELECT...');
      try {
        const packages = await client.query('SELECT id, name FROM subscription_packages LIMIT 1');
        if (packages.rows.length > 0) {
          console.log(`   ✅ subscription_packages SELECT works: ${packages.rows[0].name}`);
        } else {
          console.log('   ⚠️  No subscription packages found');
        }
      } catch (packError) {
        console.log(`   ❌ subscription_packages SELECT failed: ${packError.message}`);
      }
      
      console.log('\n6️⃣ Testing INSERT with minimal data...');
      try {
        // Get package ID first
        const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
        const packageId = packageResult.rows[0]?.id;
        
        if (!packageId) {
          throw new Error('No subscription package available for test');
        }
        
        // Test the exact INSERT that's failing
        const insertResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING id, name
        `, ['Pinpoint Test', 'pinpoint-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log(`   ✅ INSERT succeeded! Created: ${insertResult.rows[0].name} (${insertResult.rows[0].id})`);
        
        // Clean up immediately
        await client.query('DELETE FROM tenants WHERE id = $1', [insertResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (insertError) {
        console.log(`   ❌ INSERT failed: ${insertError.message}`);
        console.log(`   Error code: ${insertError.code}`);
        console.log(`   Error detail: ${insertError.detail}`);
        console.log(`   Error hint: ${insertError.hint}`);
        console.log(`   Stack: ${insertError.stack?.split('\n')[0]}`);
      }
      
      console.log('\n7️⃣ Testing with different INSERT syntax...');
      try {
        const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
        const packageId = packageResult.rows[0]?.id;
        
        // Try with explicit column list and simple values
        const simpleInsert = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status) 
          VALUES ('Simple Test', 'simple-test', $1, 'active')
          RETURNING id, name
        `, [packageId]);
        
        console.log(`   ✅ Simple INSERT succeeded! Created: ${simpleInsert.rows[0].name}`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [simpleInsert.rows[0].id]);
        console.log('   ✅ Simple cleanup successful');
        
      } catch (simpleError) {
        console.log(`   ❌ Simple INSERT also failed: ${simpleError.message}`);
      }
      
      await client.query('COMMIT');
      console.log('\n✅ COMMIT succeeded');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('\n❌ Pinpoint test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

pinpointPermissionError();