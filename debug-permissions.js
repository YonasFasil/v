/**
 * Debug script to check user permissions in database
 */

// Import the storage to check user permissions
import { storage } from './dist/index.js';

async function checkUserPermissions() {
  console.log('🔍 CHECKING USER PERMISSIONS IN DATABASE');
  console.log('==========================================\n');
  
  try {
    // Get all users
    const users = await storage.getUsers();
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Permissions: ${JSON.stringify(user.permissions)}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log('');
    });
    
    // Check specifically for tenant_admin and tenant_user
    const tenantAdmin = users.find(u => u.role === 'tenant_admin');
    const tenantUser = users.find(u => u.role === 'tenant_user');
    
    if (tenantAdmin) {
      console.log('👑 TENANT ADMIN FOUND:');
      console.log(`   Permissions: ${JSON.stringify(tenantAdmin.permissions)}`);
      console.log(`   Expected: Should have all 9 permissions`);
      console.log('');
    }
    
    if (tenantUser) {
      console.log('👤 TENANT USER FOUND:');
      console.log(`   Permissions: ${JSON.stringify(tenantUser.permissions)}`);
      console.log(`   Expected: Should have assigned permissions`);
      console.log('');
    }
    
    // Show expected vs actual
    console.log('✅ EXPECTED PERMISSIONS:');
    console.log('   Tenant Admin: ["dashboard","users","venues","bookings","customers","proposals","tasks","payments","settings"]');
    console.log('   Tenant User: ["dashboard","bookings","customers","proposals"]');
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  }
}

checkUserPermissions();