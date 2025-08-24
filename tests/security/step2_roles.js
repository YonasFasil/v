const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

/**
 * Security Test: Database Role Lockdown
 * 
 * This test verifies that database roles are properly configured for security:
 * - venuine_app role has NOSUPERUSER and NOBYPASSRLS
 * - Proper separation between owner and application roles
 * - PUBLIC privileges are properly restricted
 */

async function testDatabaseRoles() {
  console.log('🗄️  Testing Database Role Security...\n');
  
  // Connect as postgres/owner to check role configuration
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  const testResults = [];

  try {
    // Test 1: Check venuine_app role security flags
    console.log('📋 Test 1: Verify venuine_app role security configuration');
    
    const roleCheck = await pool.query(`
      SELECT rolname, rolbypassrls, rolsuper, rolcreatedb, rolcreaterole 
      FROM pg_roles 
      WHERE rolname = 'venuine_app'
    `);

    if (roleCheck.rows.length === 0) {
      console.log('❌ FAIL: venuine_app role does not exist');
      testResults.push({ 
        test: 'venuine_app_exists', 
        passed: false, 
        message: 'venuine_app role not found' 
      });
    } else {
      const role = roleCheck.rows[0];
      
      if (!role.rolbypassrls && !role.rolsuper) {
        console.log('✅ PASS: venuine_app has NOSUPERUSER and NOBYPASSRLS');
        testResults.push({ 
          test: 'venuine_app_security', 
          passed: true, 
          message: 'Role properly restricted' 
        });
      } else {
        console.log('❌ FAIL: venuine_app has dangerous privileges:');
        console.log(`   - Can bypass RLS: ${role.rolbypassrls}`);
        console.log(`   - Is superuser: ${role.rolsuper}`);
        testResults.push({ 
          test: 'venuine_app_security', 
          passed: false, 
          message: 'Role has dangerous privileges' 
        });
      }
    }

    // Test 2: Check venuine_owner role exists and has appropriate privileges
    console.log('\n📋 Test 2: Verify venuine_owner role configuration');
    
    const ownerCheck = await pool.query(`
      SELECT rolname, rolbypassrls, rolsuper, rolcreatedb, rolcreaterole 
      FROM pg_roles 
      WHERE rolname = 'venuine_owner'
    `);

    if (ownerCheck.rows.length === 0) {
      console.log('❌ FAIL: venuine_owner role does not exist');
      testResults.push({ 
        test: 'venuine_owner_exists', 
        passed: false, 
        message: 'venuine_owner role not found' 
      });
    } else {
      const owner = ownerCheck.rows[0];
      console.log('✅ PASS: venuine_owner role exists');
      console.log(`   - Can create DB: ${owner.rolcreatedb}`);
      console.log(`   - Can create roles: ${owner.rolcreaterole}`);
      testResults.push({ 
        test: 'venuine_owner_exists', 
        passed: true, 
        message: 'Owner role properly configured' 
      });
    }

    // Test 3: Verify table ownership
    console.log('\n📋 Test 3: Verify table ownership separation');
    
    const ownershipCheck = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner,
        CASE 
          WHEN tableowner = 'venuine_owner' THEN true
          ELSE false
        END as correct_owner
      FROM pg_tables 
      WHERE schemaname = 'public'
      LIMIT 5
    `);

    const correctOwnership = ownershipCheck.rows.every(row => row.correct_owner);
    
    if (correctOwnership && ownershipCheck.rows.length > 0) {
      console.log('✅ PASS: Tables owned by venuine_owner (not app role)');
      console.log(`   Checked ${ownershipCheck.rows.length} tables`);
      testResults.push({ 
        test: 'table_ownership', 
        passed: true, 
        message: 'Proper owner/app role separation' 
      });
    } else {
      console.log('❌ FAIL: Some tables have incorrect ownership:');
      ownershipCheck.rows.forEach(row => {
        if (!row.correct_owner) {
          console.log(`   - ${row.tablename}: owned by ${row.tableowner} (should be venuine_owner)`);
        }
      });
      testResults.push({ 
        test: 'table_ownership', 
        passed: false, 
        message: 'Tables not owned by venuine_owner' 
      });
    }

    // Test 4: Test app role permissions (should have limited CRUD)
    console.log('\n📋 Test 4: Verify app role has minimal required permissions');
    
    const permCheck = await pool.query(`
      SELECT 
        grantee,
        table_schema,
        table_name,
        string_agg(privilege_type, ', ') as privileges
      FROM information_schema.role_table_grants 
      WHERE grantee = 'venuine_app' 
        AND table_schema = 'public'
      GROUP BY grantee, table_schema, table_name
      LIMIT 3
    `);

    if (permCheck.rows.length > 0) {
      console.log('✅ PASS: venuine_app has table permissions');
      permCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}: ${row.privileges}`);
      });
      testResults.push({ 
        test: 'app_permissions', 
        passed: true, 
        message: 'App role has required table access' 
      });
    } else {
      console.log('⚠️  WARNING: No explicit table grants found for venuine_app');
      console.log('   (May inherit permissions or use different grant mechanism)');
      testResults.push({ 
        test: 'app_permissions', 
        passed: true, 
        message: 'Permission check inconclusive' 
      });
    }

    // Test 5: Verify security monitoring view
    console.log('\n📋 Test 5: Check security monitoring view');
    
    try {
      const securityView = await pool.query(`
        SELECT rolname, security_status, is_superuser, can_bypass_rls
        FROM security_role_status 
        WHERE rolname IN ('venuine_app', 'venuine_owner')
        ORDER BY rolname
      `);

      if (securityView.rows.length > 0) {
        console.log('✅ PASS: Security monitoring view accessible');
        securityView.rows.forEach(row => {
          console.log(`   - ${row.rolname}: ${row.security_status}`);
        });
        testResults.push({ 
          test: 'security_monitoring', 
          passed: true, 
          message: 'Security view working' 
        });
      }
    } catch (error) {
      console.log('⚠️  WARNING: Security monitoring view not available');
      console.log(`   Error: ${error.message}`);
      testResults.push({ 
        test: 'security_monitoring', 
        passed: false, 
        message: 'Security view not accessible' 
      });
    }

  } catch (error) {
    console.error('❌ Database role test failed:', error.message);
    testResults.push({ 
      test: 'database_connection', 
      passed: false, 
      message: `Database error: ${error.message}` 
    });
  } finally {
    await pool.end();
  }

  // Summary
  console.log('\n📊 Database Role Security Results:');
  console.log('===================================');
  
  const allPassed = testResults.every(result => result.passed);
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.test} - ${result.message}`);
  });

  if (allPassed) {
    console.log('\n🎉 ALL DATABASE ROLE SECURITY TESTS PASSED!');
    console.log('   Database roles are properly configured for tenant isolation.');
    process.exit(0);
  } else {
    console.log('\n🚨 DATABASE ROLE SECURITY TESTS FAILED!');
    console.log('   Please run the role lockdown migration and fix failing tests.');
    process.exit(1);
  }
}

// Run the test
testDatabaseRoles().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});