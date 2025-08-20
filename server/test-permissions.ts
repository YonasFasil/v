/**
 * Permission System Test Script
 * This script demonstrates how the permission system works and identifies issues
 */

import { storage } from './storage';
import { requirePermissions, requireRole, PERMISSIONS } from './middleware/permissions';

async function testPermissionSystem() {
  console.log('🧪 Testing Permission System...\n');

  try {
    // 1. Test user data retrieval
    console.log('1. Testing user data structure...');
    const users = await storage.getUsers();
    const sampleUser = users.find(u => u.role === 'tenant_user');
    
    if (sampleUser) {
      console.log('✅ Sample user found:');
      console.log(`   - ID: ${sampleUser.id}`);
      console.log(`   - Role: ${sampleUser.role}`);
      console.log(`   - Permissions: ${JSON.stringify(sampleUser.permissions)}`);
      console.log(`   - Tenant ID: ${sampleUser.tenantId}`);
    } else {
      console.log('❌ No tenant_user found in system');
    }

    // 2. Test admin user data
    console.log('\n2. Testing admin user data...');
    const adminUser = users.find(u => u.role === 'tenant_admin');
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Permissions: ${JSON.stringify(adminUser.permissions)}`);
      console.log(`   - Tenant ID: ${adminUser.tenantId}`);
    } else {
      console.log('❌ No tenant_admin found in system');
    }

    // 3. Test available permissions
    console.log('\n3. Available permission constants:');
    Object.entries(PERMISSIONS).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    // 4. Identify permission gaps
    console.log('\n4. Permission Analysis:');
    const allPermissions = users.map(u => u.permissions).flat();
    const uniquePermissions = [...new Set(allPermissions)];
    
    console.log('📊 Permissions currently in use:');
    uniquePermissions.forEach(perm => {
      console.log(`   - ${perm}`);
    });

    // 5. Security recommendations
    console.log('\n🔒 Security Recommendations:');
    console.log('   1. All API routes should use requireAuthWithPermissions middleware');
    console.log('   2. Critical routes need specific permission checks');
    console.log('   3. JWT tokens should include user permissions');
    console.log('   4. Client-side permission checks should be secondary to server-side');
    console.log('   5. Regular permission audits should be performed');

  } catch (error) {
    console.error('❌ Permission system test failed:', error);
  }
}

// Run test if called directly
if (require.main === module) {
  testPermissionSystem()
    .then(() => console.log('\n✨ Permission system test completed'))
    .catch(console.error);
}

export { testPermissionSystem };