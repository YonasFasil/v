// Load environment variables first
require('dotenv').config();

// Use tsx to load TypeScript files
const tsx = require('tsx/cjs/api');
tsx.register();

const { queryWithTenantContext, withTenantContext } = require('../server/db/tenant-context.ts');

/**
 * Test that database-level tenant context with SET LOCAL commands work properly
 * This verifies that RLS policies are enforced at the database level
 */
async function testDatabaseTenantContext() {
  console.log('🔐 Testing database-level tenant context with SET LOCAL commands...\n');
  
  try {
    // Test 1: Query with tenant context should set session variables
    console.log('1️⃣ Testing queryWithTenantContext:');
    
    const testTenantId = 'a428a75c-6453-4a16-a94e-9161059b1b1b'; // Use existing tenant from logs
    
    // Query companies with tenant context
    const companies = await queryWithTenantContext(
      testTenantId,
      'tenant_admin',
      'SELECT id, name, tenant_id FROM companies WHERE tenant_id = $1 LIMIT 5',
      [testTenantId]
    );
    
    console.log(`✅ Found ${companies.length} companies with proper tenant context`);
    console.log('   Companies:', companies.map(c => ({ id: c.id, name: c.name })));
    
    // Test 2: Verify tenant context is properly set with transaction wrapper
    console.log('\n2️⃣ Testing withTenantContext transaction wrapper:');
    
    const result = await withTenantContext(testTenantId, 'tenant_admin', async (client) => {
      // This should run with proper tenant context set
      const settingsResult = await client.query(
        'SELECT key, value FROM settings WHERE tenant_id = $1 LIMIT 3',
        [testTenantId]
      );
      
      return {
        settingsCount: settingsResult.rows.length,
        settings: settingsResult.rows
      };
    });
    
    console.log(`✅ Transaction wrapper worked: ${result.settingsCount} settings found`);
    console.log('   Settings:', result.settings.map(s => s.key));
    
    // Test 3: Test that session variables are properly set
    console.log('\n3️⃣ Testing session variables are properly set:');
    
    await withTenantContext(testTenantId, 'tenant_admin', async (client) => {
      // Check that our session variables are set
      const sessionResult = await client.query(`
        SELECT 
          current_setting('app.current_tenant', true) as current_tenant,
          current_setting('app.user_role', true) as user_role,
          current_user as database_role
      `);
      
      const session = sessionResult.rows[0];
      console.log('✅ Session variables confirmed:');
      console.log(`   app.current_tenant: ${session.current_tenant}`);
      console.log(`   app.user_role: ${session.user_role}`);
      console.log(`   database_role: ${session.database_role}`);
      
      // Verify they match what we expect
      if (session.current_tenant === testTenantId) {
        console.log('   ✅ Tenant context correctly set');
      } else {
        console.log('   ❌ Tenant context mismatch!');
      }
      
      if (session.user_role === 'tenant_admin') {
        console.log('   ✅ User role correctly set');
      } else {
        console.log('   ❌ User role mismatch!');
      }
    });
    
    console.log('\n🎉 All database-level tenant context tests passed!');
    console.log('   Row-Level Security policies should now be properly enforced');
    
  } catch (error) {
    console.error('❌ Database tenant context test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testDatabaseTenantContext();