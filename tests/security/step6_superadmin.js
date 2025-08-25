const { Pool } = require('pg');
const axios = require('axios');

/**
 * STEP 6: Super-admin "Assume Tenant" + Audit Tests
 * 
 * Tests:
 * 1. As super-admin without assuming → attempt to read tenant data → denied/0 rows
 * 2. Call assume-tenant, then read → allowed
 * 3. Verify audit row inserted
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
});

const BASE_URL = 'http://localhost:5173'; // Adjust if different
let superAdminToken = null;
let testTenantId = null;

async function testStep6SuperAdmin() {
  console.log('\n🔒 STEP 6: Testing super-admin assume tenant + audit...\n');
  
  let testsPassed = 0;
  let totalTests = 3;
  
  try {
    // First, get a super-admin token
    console.log('🔑 Getting super-admin authentication...');
    await authenticateAsSuperAdmin();
    await findTestTenant();
    
    if (!superAdminToken || !testTenantId) {
      console.log('❌ FAIL: Could not set up test prerequisites');
      return false;
    }
    
    // Test 1: Super-admin without assuming should get 0 rows (RLS blocks access)
    console.log('📊 Test 1: Super-admin access without assuming tenant...');
    try {
      const response = await axios.get(`${BASE_URL}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${superAdminToken}`
        }
      });
      
      // Super-admin should get 0 rows when not assuming tenant context
      if (response.data && response.data.length === 0) {
        console.log('✅ PASS: Super-admin correctly blocked from tenant data without assumption');
        testsPassed++;
      } else {
        console.log(`❌ FAIL: Super-admin got ${response.data?.length || 0} rows without tenant assumption`);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ PASS: Super-admin correctly denied access without tenant assumption');
        testsPassed++;
      } else {
        console.log('❌ FAIL: Unexpected error for super-admin without assumption');
        console.log('   Error:', error.message);
      }
    }
    
    // Test 2: Assume tenant and try again
    console.log('\n🎭 Test 2: Super-admin assume tenant and access data...');
    try {
      // Call assume-tenant endpoint
      const assumeResponse = await axios.post(`${BASE_URL}/api/super-admin/assume-tenant`, {
        tenantId: testTenantId,
        reason: 'Testing super-admin assume tenant functionality for security validation'
      }, {
        headers: {
          'Authorization': `Bearer ${superAdminToken}`
        }
      });
      
      if (assumeResponse.data?.assumeToken) {
        console.log('✅ Assume tenant token received');
        
        // Now try to access tenant data with the assume token
        const dataResponse = await axios.get(`${BASE_URL}/api/customers`, {
          headers: {
            'Authorization': `Bearer ${assumeResponse.data.assumeToken}`
          }
        });
        
        if (dataResponse.status === 200) {
          console.log('✅ PASS: Super-admin can access tenant data after assumption');
          console.log(`   Retrieved ${dataResponse.data?.length || 0} customer records`);
          testsPassed++;
        } else {
          console.log('❌ FAIL: Super-admin could not access tenant data after assumption');
        }
      } else {
        console.log('❌ FAIL: Assume tenant did not return token');
      }
    } catch (error) {
      console.log('❌ FAIL: Assume tenant or data access failed');
      console.log('   Error:', error.message);
    }
    
    // Test 3: Verify audit row was inserted
    console.log('\n📝 Test 3: Verify audit trail...');
    try {
      const auditCheck = await pool.query(`
        SELECT 
          admin_user_id,
          tenant_id,
          reason,
          ip,
          user_agent,
          token_expires_at,
          created_at
        FROM admin_audit 
        WHERE tenant_id = $1 
        AND reason LIKE '%Testing super-admin assume tenant%'
        ORDER BY created_at DESC 
        LIMIT 1
      `, [testTenantId]);
      
      if (auditCheck.rows.length > 0) {
        const auditRow = auditCheck.rows[0];
        console.log('✅ PASS: Audit row found');
        console.log(`   Admin ID: ${auditRow.admin_user_id}`);
        console.log(`   Tenant ID: ${auditRow.tenant_id}`);
        console.log(`   Reason: ${auditRow.reason.substring(0, 50)}...`);
        console.log(`   IP: ${auditRow.ip}`);
        console.log(`   Created: ${auditRow.created_at}`);
        console.log(`   Expires: ${auditRow.token_expires_at}`);
        testsPassed++;
      } else {
        console.log('❌ FAIL: No audit row found');
      }
    } catch (error) {
      console.log('❌ FAIL: Error checking audit trail');
      console.log('   Error:', error.message);
    }
    
  } catch (error) {
    console.log('❌ CRITICAL ERROR during Step 6 tests:', error.message);
  }
  
  // Results
  console.log(`\n📊 Step 6 Results: ${testsPassed}/${totalTests} tests passed`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 STEP 6: PASSED - Super-admin assume tenant and audit logging working correctly!');
    return true;
  } else {
    console.log('❌ STEP 6: FAILED - Some super-admin assume tenant features are not working properly');
    return false;
  }
}

async function authenticateAsSuperAdmin() {
  try {
    // Try to get existing super-admin credentials or create one
    const users = await pool.query(`
      SELECT id, email FROM users WHERE role = 'super_admin' LIMIT 1
    `);
    
    if (users.rows.length === 0) {
      console.log('❌ No super-admin user found. Please create one first.');
      return;
    }
    
    const superAdmin = users.rows[0];
    console.log(`🔑 Found super-admin: ${superAdmin.email}`);
    
    // For testing, we'll create a token directly (bypassing password check)
    // In real implementation, you'd call the login endpoint
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev-secret';
    
    superAdminToken = jwt.sign({
      id: superAdmin.id,
      email: superAdmin.email,
      role: 'super_admin'
    }, secret);
    
    console.log('✅ Super-admin token created');
  } catch (error) {
    console.error('❌ Failed to authenticate as super-admin:', error.message);
  }
}

async function findTestTenant() {
  try {
    const tenants = await pool.query(`
      SELECT id, name FROM tenants WHERE status = 'active' LIMIT 1
    `);
    
    if (tenants.rows.length > 0) {
      testTenantId = tenants.rows[0].id;
      console.log(`🏢 Using test tenant: ${tenants.rows[0].name} (${testTenantId})`);
    } else {
      console.log('❌ No active tenant found for testing');
    }
  } catch (error) {
    console.error('❌ Failed to find test tenant:', error.message);
  }
}

module.exports = { testStep6SuperAdmin };

// Run the test if this file is executed directly
if (require.main === module) {
  testStep6SuperAdmin()
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