const { Pool } = require('pg');

/**
 * STEP 5: Tenant-Safe Uniqueness + FK Integrity Tests
 * 
 * Tests:
 * 1. Insert same email in Tenant A and Tenant B → both succeed
 * 2. Insert duplicate email in same tenant → fails
 * 3. Try inserting booking referencing venue from different tenant → fails
 */

const pool = new Pool({
  user: 'postgres',
  password: 'ZxOp1029!!%%',
  host: 'localhost',
  port: 5432,
  database: 'venuedb'
});

// Generate UUIDs for test tenants
const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

async function testStep5Constraints() {
  console.log('\n🔒 STEP 5: Testing tenant-safe uniqueness and FK integrity...\n');
  
  let testsPassed = 0;
  let totalTests = 3;
  
  // Note: Running as postgres superuser for constraint testing
  // The RLS bypass is expected for superuser - we're testing constraint-level isolation
  await pool.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [TENANT_A]);
  
  try {
    // Clean up any test data first
    await cleanupTestData();
    
    // Test 1: Same email in different tenants should succeed
    console.log('📧 Test 1: Same email in different tenants...');
    try {
      // Insert in tenant A
      await pool.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [TENANT_A]);
      await pool.query(`
        INSERT INTO customers (tenant_id, email, name, phone, created_at) 
        VALUES ($1, 'test@example.com', 'Customer A1', '555-0001', NOW())
      `, [TENANT_A]);
      
      // Switch to tenant B and insert same email
      await pool.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [TENANT_B]);
      await pool.query(`
        INSERT INTO customers (tenant_id, email, name, phone, created_at) 
        VALUES ($1, 'test@example.com', 'Customer A2', '555-0002', NOW())
      `, [TENANT_B]);
      
      console.log('✅ PASS: Same email allowed in different tenants');
      testsPassed++;
    } catch (error) {
      console.log('❌ FAIL: Same email in different tenants should succeed');
      console.log('   Error:', error.message);
    }
    
    // Test 2: Duplicate email in same tenant should fail
    console.log('\n📧 Test 2: Duplicate email in same tenant should fail...');
    try {
      await pool.query(`SELECT set_config('app.current_tenant_id', $1, true);`, [TENANT_A]);
      await pool.query(`
        INSERT INTO customers (tenant_id, email, name, phone, created_at) 
        VALUES ($1, 'duplicate@example.com', 'First Customer', '555-0003', NOW())
      `, [TENANT_A]);
      
      // This should fail - same tenant, same email
      await pool.query(`
        INSERT INTO customers (tenant_id, email, name, phone, created_at) 
        VALUES ($1, 'duplicate@example.com', 'Second Customer', '555-0004', NOW())
      `, [TENANT_A]);
      
      console.log('❌ FAIL: Duplicate email in same tenant should be blocked');
    } catch (error) {
      if (error.message.includes('duplicate key value') || error.message.includes('unique constraint')) {
        console.log('✅ PASS: Duplicate email in same tenant correctly blocked');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Unexpected error for duplicate email test');
        console.log('   Error:', error.message);
      }
    }
    
    // Test 3: Cross-tenant FK reference should fail
    console.log('\n🔗 Test 3: Cross-tenant FK reference should fail...');
    try {
      // Create venues in different tenants
      const venue1 = await pool.query(`
        INSERT INTO venues (tenant_id, name, description, capacity, created_at) 
        VALUES ($1, 'Test Venue 1', 'Test venue in tenant A', 100, NOW()) 
        RETURNING id
      `, [TENANT_A]);
      
      const venue2 = await pool.query(`
        INSERT INTO venues (tenant_id, name, description, capacity, created_at) 
        VALUES ($1, 'Test Venue 2', 'Test venue in tenant B', 200, NOW()) 
        RETURNING id
      `, [TENANT_B]);
      
      const customer1 = await pool.query(`
        INSERT INTO customers (tenant_id, email, name, phone, created_at) 
        VALUES ($1, 'customer1@example.com', 'Test Customer 1', '555-0011', NOW()) 
        RETURNING id
      `, [TENANT_A]);
      
      // Try to create a booking in tenant 1 referencing venue from tenant 2
      await pool.query(`
        INSERT INTO bookings (tenant_id, customer_id, venue_id, event_date, status, created_at) 
        VALUES ($1, $2, $3, '2024-12-31', 'pending', NOW())
      `, [TENANT_A, customer1.rows[0].id, venue2.rows[0].id]);
      
      console.log('❌ FAIL: Cross-tenant FK reference should be blocked');
    } catch (error) {
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        console.log('✅ PASS: Cross-tenant FK reference correctly blocked');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Unexpected error for cross-tenant FK test');
        console.log('   Error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ CRITICAL ERROR during Step 5 tests:', error.message);
  } finally {
    // Clean up test data
    await cleanupTestData();
  }
  
  // Results
  console.log(`\n📊 Step 5 Results: ${testsPassed}/${totalTests} tests passed`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 STEP 5: PASSED - Tenant-safe uniqueness and FK integrity working correctly!');
    return true;
  } else {
    console.log('❌ STEP 5: FAILED - Some tenant isolation constraints are not working properly');
    return false;
  }
}

async function cleanupTestData() {
  try {
    // Clean up in reverse dependency order
    await pool.query(`DELETE FROM bookings WHERE tenant_id IN (1, 2) AND customer_id IN (SELECT id FROM customers WHERE email LIKE '%@example.com')`);
    await pool.query(`DELETE FROM customers WHERE email LIKE '%@example.com'`);
    await pool.query(`DELETE FROM venues WHERE name LIKE 'Test Venue%'`);
  } catch (error) {
    // Ignore cleanup errors
  }
}

module.exports = { testStep5Constraints };

// Run the test if this file is executed directly
if (require.main === module) {
  testStep5Constraints()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}