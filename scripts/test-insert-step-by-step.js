const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testInsertStepByStep() {
  console.log('🔍 Testing INSERT step by step to isolate the exact issue...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Getting required values first...');
    
    const packageResult = await pool.query('SELECT id FROM subscription_packages LIMIT 1');
    const packageId = packageResult.rows[0]?.id;
    
    if (!packageId) {
      throw new Error('No subscription packages found');
    }
    console.log(`   Using package ID: ${packageId}`);
    
    console.log('\n2️⃣ Testing INSERT with required fields only...');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      try {
        const requiredResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id) 
          VALUES ($1, $2, $3)
          RETURNING id, name, slug
        `, ['Required Test', 'required-test', packageId]);
        
        console.log(`   ✅ Required fields INSERT succeeded: ${requiredResult.rows[0].name}`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [requiredResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (requiredError) {
        console.log(`   ❌ Required fields INSERT failed: ${requiredError.message}`);
        console.log(`   Error code: ${requiredError.code}`);
      }
      
      console.log('\n3️⃣ Testing INSERT with status field added...');
      
      try {
        const statusResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status) 
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, slug, status
        `, ['Status Test', 'status-test', packageId, 'active']);
        
        console.log(`   ✅ With status INSERT succeeded: ${statusResult.rows[0].name} (${statusResult.rows[0].status})`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [statusResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (statusError) {
        console.log(`   ❌ With status INSERT failed: ${statusError.message}`);
        console.log(`   Error code: ${statusError.code}`);
      }
      
      console.log('\n4️⃣ Testing INSERT with timestamp fields...');
      
      try {
        const timestampResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id, name, created_at
        `, ['Timestamp Test', 'timestamp-test', packageId, 'active']);
        
        console.log(`   ✅ With timestamps INSERT succeeded: ${timestampResult.rows[0].name}`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [timestampResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (timestampError) {
        console.log(`   ❌ With timestamps INSERT failed: ${timestampError.message}`);
        console.log(`   Error code: ${timestampError.code}`);
      }
      
      console.log('\n5️⃣ Testing INSERT with numeric fields...');
      
      try {
        const numericResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings) 
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7)
          RETURNING id, name
        `, ['Numeric Test', 'numeric-test', packageId, 'active', 0, 0, 0]);
        
        console.log(`   ✅ With numeric fields INSERT succeeded: ${numericResult.rows[0].name}`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [numericResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (numericError) {
        console.log(`   ❌ With numeric fields INSERT failed: ${numericError.message}`);
        console.log(`   Error code: ${numericError.code}`);
      }
      
      console.log('\n6️⃣ Testing INSERT with primary_color field...');
      
      try {
        const colorResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color) 
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING id, name, primary_color
        `, ['Color Test', 'color-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log(`   ✅ With primary_color INSERT succeeded: ${colorResult.rows[0].name} (${colorResult.rows[0].primary_color})`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [colorResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (colorError) {
        console.log(`   ❌ With primary_color INSERT failed: ${colorError.message}`);
        console.log(`   Error code: ${colorError.code}`);
        
        // This might be the culprit - let's check if there's something special about this field
        if (colorError.message.includes('permission denied')) {
          console.log('   🎯 FOUND IT: primary_color field causes permission denied!');
        }
      }
      
      console.log('\n7️⃣ Testing our exact original INSERT that was failing...');
      
      try {
        const originalResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING id, name
        `, ['Original Test', 'original-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log(`   ✅ Original INSERT now works: ${originalResult.rows[0].name}`);
        
        await client.query('DELETE FROM tenants WHERE id = $1', [originalResult.rows[0].id]);
        console.log('   ✅ Cleanup successful');
        
      } catch (originalError) {
        console.log(`   ❌ Original INSERT still fails: ${originalError.message}`);
        console.log(`   Error code: ${originalError.code}`);
      }
      
      await client.query('COMMIT');
      
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Step-by-step test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testInsertStepByStep();