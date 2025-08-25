const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

/**
 * Security Test: Row-Level Security Enforcement
 * 
 * This test verifies that RLS is properly enabled and forced on all tenant tables:
 * - relrowsecurity = true (RLS enabled)
 * - relforcerowsecurity = true (RLS forced, applies to table owners)
 * - Proper tenant isolation policies exist
 * - Session variable requirements are documented
 */

async function testRLSFlags() {
  console.log('🛡️  Testing Row-Level Security Configuration...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  const testResults = [];

  // Define the representative set of tables to test (as specified in requirements)
  const testTables = ['customers', 'bookings', 'venues', 'proposals', 'users', 'payments', 'services', 'companies'];

  try {
    // Test 1: Check RLS flags on representative tables
    console.log('📋 Test 1: Verify RLS enabled and forced on sample tables');
    
    const rlsCheck = await pool.query(`
      SELECT 
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
        AND c.relname IN ($1, $2, $3, $4, $5, $6, $7, $8)
      ORDER BY c.relname
    `, testTables);

    console.log('RLS Status for Sample Tables:');
    let allTablesSecure = true;
    
    rlsCheck.rows.forEach(table => {
      const rlsStatus = table.rls_enabled ? '✅' : '❌';
      const forceStatus = table.rls_forced ? '✅' : '❌';
      const overallStatus = (table.rls_enabled && table.rls_forced) ? '✅ SECURE' : '❌ INSECURE';
      
      console.log(`   ${overallStatus} ${table.table_name}:`);
      console.log(`      RLS Enabled: ${rlsStatus} ${table.rls_enabled}`);
      console.log(`      RLS Forced: ${forceStatus} ${table.rls_forced}`);
      
      if (!table.rls_enabled || !table.rls_forced) {
        allTablesSecure = false;
      }
    });

    if (allTablesSecure && rlsCheck.rows.length === testTables.length) {
      console.log('\n✅ PASS: All sample tables have RLS enabled and forced');
      testResults.push({ 
        test: 'rls_flags_sample', 
        passed: true, 
        message: 'Sample tables properly secured' 
      });
    } else {
      console.log('\n❌ FAIL: Some tables missing proper RLS configuration');
      testResults.push({ 
        test: 'rls_flags_sample', 
        passed: false, 
        message: 'RLS configuration incomplete' 
      });
    }

    // Test 2: Check all tenant tables have RLS enabled
    console.log('\n📋 Test 2: Verify RLS on all tenant tables');
    
    const allTablesCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_tenant_tables,
        SUM(CASE WHEN c.relrowsecurity AND c.relforcerowsecurity THEN 1 ELSE 0 END) as secure_tables,
        SUM(CASE WHEN c.relrowsecurity THEN 1 ELSE 0 END) as rls_enabled_tables
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN information_schema.columns ic ON ic.table_name = c.relname AND ic.table_schema = 'public'
      WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND ic.column_name = 'tenant_id'
    `);

    const stats = allTablesCheck.rows[0];
    console.log(`Total tenant tables: ${stats.total_tenant_tables}`);
    console.log(`RLS enabled: ${stats.rls_enabled_tables}`);
    console.log(`RLS enabled + forced: ${stats.secure_tables}`);

    if (stats.secure_tables === stats.total_tenant_tables && stats.secure_tables > 0) {
      console.log('✅ PASS: All tenant tables have RLS enabled and forced');
      testResults.push({ 
        test: 'all_tenant_tables_rls', 
        passed: true, 
        message: `All ${stats.secure_tables} tenant tables secured` 
      });
    } else {
      console.log('❌ FAIL: Not all tenant tables have proper RLS configuration');
      testResults.push({ 
        test: 'all_tenant_tables_rls', 
        passed: false, 
        message: `Only ${stats.secure_tables}/${stats.total_tenant_tables} tables secured` 
      });
    }

    // Test 3: Check tenant isolation policies exist
    console.log('\n📋 Test 3: Verify tenant isolation policies');
    
    const policyCheck = await pool.query(`
      SELECT 
        p.tablename,
        COUNT(*) as policy_count,
        STRING_AGG(p.policyname, ', ') as policies
      FROM pg_policies p
      WHERE p.schemaname = 'public'
        AND p.tablename IN ($1, $2, $3, $4, $5)
        AND p.policyname LIKE '%tenant%'
      GROUP BY p.tablename
      ORDER BY p.tablename
    `, ['customers', 'bookings', 'venues', 'proposals', 'users']);

    console.log('Tenant Isolation Policies:');
    let expectedPolicies = 0;
    policyCheck.rows.forEach(table => {
      console.log(`   ${table.tablename}: ${table.policy_count} policies`);
      console.log(`      Policies: ${table.policies}`);
      expectedPolicies += parseInt(table.policy_count);
    });

    if (expectedPolicies >= 10) { // At least 2 policies per table for 5 tables
      console.log('\n✅ PASS: Tenant isolation policies found');
      testResults.push({ 
        test: 'tenant_policies', 
        passed: true, 
        message: `${expectedPolicies} tenant policies found` 
      });
    } else {
      console.log('\n❌ FAIL: Insufficient tenant isolation policies');
      testResults.push({ 
        test: 'tenant_policies', 
        passed: false, 
        message: `Only ${expectedPolicies} policies found` 
      });
    }

    // Test 4: Check RLS monitoring view exists
    console.log('\n📋 Test 4: Verify RLS monitoring view');
    
    try {
      const monitoringView = await pool.query(`
        SELECT tablename, security_status, rls_enabled, rls_forced, policy_count
        FROM rls_security_status 
        WHERE security_status = '✅ SECURE'
        LIMIT 5
      `);

      if (monitoringView.rows.length > 0) {
        console.log('✅ PASS: RLS monitoring view accessible');
        console.log('Sample secure tables:');
        monitoringView.rows.forEach(row => {
          console.log(`   ${row.security_status} ${row.tablename} (${row.policy_count} policies)`);
        });
        testResults.push({ 
          test: 'rls_monitoring', 
          passed: true, 
          message: 'Monitoring view working' 
        });
      }
    } catch (error) {
      console.log('❌ FAIL: RLS monitoring view not accessible');
      console.log(`   Error: ${error.message}`);
      testResults.push({ 
        test: 'rls_monitoring', 
        passed: false, 
        message: 'Monitoring view error' 
      });
    }

    // Test 5: Verify session variable requirements are documented
    console.log('\n📋 Test 5: Session variable requirements check');
    
    const sessionVarCheck = await pool.query(`
      SELECT COUNT(*) as policy_count
      FROM pg_policies 
      WHERE (qual IS NOT NULL AND qual::text LIKE '%current_setting%'
        AND qual::text LIKE '%app.current_tenant%'
        AND qual::text LIKE '%app.user_role%')
      OR (with_check IS NOT NULL AND with_check::text LIKE '%current_setting%'
        AND with_check::text LIKE '%app.current_tenant%'
        AND with_check::text LIKE '%app.user_role%')
    `);

    const sessionPolicies = sessionVarCheck.rows[0].policy_count;
    if (sessionPolicies > 10) {
      console.log('✅ PASS: Policies use required session variables');
      console.log(`   Found ${sessionPolicies} policies using app.current_tenant and app.user_role`);
      testResults.push({ 
        test: 'session_variables', 
        passed: true, 
        message: 'Session variable policies implemented' 
      });
    } else {
      console.log('❌ FAIL: Insufficient session variable usage in policies');
      testResults.push({ 
        test: 'session_variables', 
        passed: false, 
        message: 'Session variables not properly used' 
      });
    }

  } catch (error) {
    console.error('❌ RLS test failed:', error.message);
    testResults.push({ 
      test: 'database_connection', 
      passed: false, 
      message: `Database error: ${error.message}` 
    });
  } finally {
    await pool.end();
  }

  // Summary
  console.log('\n📊 Row-Level Security Test Results:');
  console.log('=====================================');
  
  const allPassed = testResults.every(result => result.passed);
  
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.test} - ${result.message}`);
  });

  if (allPassed) {
    console.log('\n🎉 ALL ROW-LEVEL SECURITY TESTS PASSED!');
    console.log('   Database enforces tenant isolation at the row level.');
    console.log('\n⚠️  IMPORTANT: Application must set session variables:');
    console.log('   - SET LOCAL app.current_tenant = tenant_uuid');
    console.log('   - SET LOCAL app.user_role = role_name');
    process.exit(0);
  } else {
    console.log('\n🚨 ROW-LEVEL SECURITY TESTS FAILED!');
    console.log('   Please run the RLS migration and fix failing tests.');
    process.exit(1);
  }
}

// Run the test
testRLSFlags().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});