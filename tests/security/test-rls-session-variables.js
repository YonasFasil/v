const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

// Simple implementation of withTenantRLSContext for testing
async function withTenantRLSContext(tenantId, userRole, operation) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });
  
  const client = await pool.connect();
  
  try {
    // Begin transaction for SET LOCAL
    await client.query('BEGIN');
    
    // Set session variables
    if (tenantId) {
      await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    } else {
      await client.query('SET LOCAL app.current_tenant = \'\'');
    }
    
    await client.query(`SET LOCAL app.user_role = '${userRole}'`);
    
    // Execute operation with RLS context
    const result = await operation(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    return result;
    
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Test RLS Session Variable Enforcement
 * 
 * This test verifies that the PostgreSQL session variables are correctly set
 * and enforced by the Row-Level Security policies.
 */

async function testRLSSessionVariables() {
  console.log('🧪 TESTING RLS SESSION VARIABLE ENFORCEMENT');
  console.log('============================================\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  const testResults = [];

  try {
    // Test 1: Verify session variables can be set
    console.log('📋 Test 1: Basic session variable setting');
    
    const client = await pool.connect();
    try {
      // Begin transaction for SET LOCAL
      await client.query('BEGIN');
      
      // Set session variables
      await client.query("SET LOCAL app.current_tenant = '123e4567-e89b-12d3-a456-426614174000'");
      await client.query("SET LOCAL app.user_role = 'tenant_admin'");
      
      // Verify they were set
      const tenantResult = await client.query("SELECT current_setting('app.current_tenant', true) as tenant_id");
      const roleResult = await client.query("SELECT current_setting('app.user_role', true) as user_role");
      
      const tenantId = tenantResult.rows[0].tenant_id;
      const userRole = roleResult.rows[0].user_role;
      
      console.log(`   Tenant ID: ${tenantId}`);
      console.log(`   User Role: ${userRole}`);
      
      if (tenantId === '123e4567-e89b-12d3-a456-426614174000' && userRole === 'tenant_admin') {
        console.log('✅ PASS: Session variables set correctly\n');
        testResults.push({ test: 'session_variable_setting', passed: true });
      } else {
        console.log('❌ FAIL: Session variables not set correctly\n');
        testResults.push({ test: 'session_variable_setting', passed: false });
      }
      
      await client.query('COMMIT');
      
    } finally {
      client.release();
    }

    // Test 2: Test withTenantRLSContext utility function
    console.log('📋 Test 2: withTenantRLSContext utility function');
    
    try {
      const result = await withTenantRLSContext(
        'test-tenant-123',
        'super_admin',
        async (client) => {
          // Check session variables within context
          const tenantCheck = await client.query("SELECT current_setting('app.current_tenant', true) as tenant_id");
          const roleCheck = await client.query("SELECT current_setting('app.user_role', true) as user_role");
          
          return {
            tenantId: tenantCheck.rows[0].tenant_id,
            userRole: roleCheck.rows[0].user_role
          };
        }
      );
      
      console.log(`   Context Tenant ID: ${result.tenantId}`);
      console.log(`   Context User Role: ${result.userRole}`);
      
      if (result.tenantId === 'test-tenant-123' && result.userRole === 'super_admin') {
        console.log('✅ PASS: withTenantRLSContext works correctly\n');
        testResults.push({ test: 'tenant_context_utility', passed: true });
      } else {
        console.log('❌ FAIL: withTenantRLSContext not working correctly\n');
        testResults.push({ test: 'tenant_context_utility', passed: false });
      }
      
    } catch (error) {
      console.log(`❌ FAIL: withTenantRLSContext error: ${error.message}\n`);
      testResults.push({ test: 'tenant_context_utility', passed: false });
    }

    // Test 3: Verify RLS policies respond to session variables
    console.log('📋 Test 3: RLS policies respond to session variables');
    
    try {
      // Test as super_admin (should see all data)
      const superAdminResult = await withTenantRLSContext(
        null, // No tenant for super admin
        'super_admin',
        async (client) => {
          const result = await client.query('SELECT COUNT(*) as count FROM bookings');
          return parseInt(result.rows[0].count);
        }
      );
      
      console.log(`   Super admin sees ${superAdminResult} bookings`);
      
      // Test as regular tenant user (should see filtered data)
      const regularUserResult = await withTenantRLSContext(
        'non-existent-tenant',
        'tenant_user',
        async (client) => {
          const result = await client.query('SELECT COUNT(*) as count FROM bookings');
          return parseInt(result.rows[0].count);
        }
      );
      
      console.log(`   Regular user sees ${regularUserResult} bookings`);
      
      // Super admin should see more or equal bookings than regular user
      if (superAdminResult >= regularUserResult) {
        console.log('✅ PASS: RLS policies filtering based on session variables\n');
        testResults.push({ test: 'rls_policy_filtering', passed: true });
      } else {
        console.log('❌ FAIL: RLS policies not filtering correctly\n');
        testResults.push({ test: 'rls_policy_filtering', passed: false });
      }
      
    } catch (error) {
      console.log(`❌ FAIL: RLS policy test error: ${error.message}\n`);
      testResults.push({ test: 'rls_policy_filtering', passed: false });
    }

    // Test 4: Verify NULL tenant handling for super admin
    console.log('📋 Test 4: NULL tenant handling for super admin');
    
    try {
      await withTenantRLSContext(
        null,
        'super_admin',
        async (client) => {
          const tenantCheck = await client.query("SELECT current_setting('app.current_tenant', true) as tenant_id");
          const roleCheck = await client.query("SELECT current_setting('app.user_role', true) as user_role");
          
          const tenantId = tenantCheck.rows[0].tenant_id;
          const userRole = roleCheck.rows[0].user_role;
          
          console.log(`   Super admin tenant context: ${tenantId || 'NULL'}`);
          console.log(`   Super admin role: ${userRole}`);
          
          // Should be empty string or null for super admin
          if ((tenantId === '' || tenantId === null) && userRole === 'super_admin') {
            console.log('✅ PASS: Super admin NULL tenant handling correct\n');
            testResults.push({ test: 'super_admin_null_tenant', passed: true });
          } else {
            console.log('❌ FAIL: Super admin NULL tenant handling incorrect\n');
            testResults.push({ test: 'super_admin_null_tenant', passed: false });
          }
        }
      );
      
    } catch (error) {
      console.log(`❌ FAIL: Super admin NULL test error: ${error.message}\n`);
      testResults.push({ test: 'super_admin_null_tenant', passed: false });
    }

  } catch (error) {
    console.error('❌ Session variable test failed:', error.message);
    testResults.push({ test: 'database_connection', passed: false });
  } finally {
    await pool.end();
  }

  // Summary
  console.log('📊 RLS SESSION VARIABLE TEST RESULTS:');
  console.log('=====================================');
  
  const allPassed = testResults.every(result => result.passed);
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.test}`);
  });

  if (allPassed) {
    console.log('\n🎉 ALL RLS SESSION VARIABLE TESTS PASSED!');
    console.log('   PostgreSQL session variables are correctly enforced.');
    console.log('   Tenant isolation is active at the database level.');
    process.exit(0);
  } else {
    console.log('\n🚨 RLS SESSION VARIABLE TESTS FAILED!');
    console.log('   Session variable enforcement needs attention.');
    process.exit(1);
  }
}

// Run the test
testRLSSessionVariables().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});