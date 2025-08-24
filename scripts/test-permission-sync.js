const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function testPermissionSync() {
  try {
    console.log('🔐 Testing Updated Permission Management System\n');

    // Check tenant users and their roles
    console.log('👥 Tenant Users by Role & Package:');
    const usersResult = await pool.query(`
      SELECT u.name, u.email, u.role, u.permissions,
             t.name as tenant_name, t.slug,
             sp.name as package_name, sp.features
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
      WHERE u.role IN ('tenant_admin', 'tenant_user')
      ORDER BY t.name, u.role DESC, u.name
    `);

    let currentTenant = '';
    usersResult.rows.forEach((user) => {
      if (user.tenant_name !== currentTenant) {
        currentTenant = user.tenant_name;
        console.log(`\n🏢 ${user.tenant_name} (${user.slug})`);
        console.log(`   📦 Package: ${user.package_name || 'None'}`);
        if (user.features) {
          console.log(`   ✨ Package Features: ${user.features.join(', ')}`);
        }
        console.log('   👥 Users:');
      }

      const roleIcon = user.role === 'tenant_admin' ? '👑' : '👤';
      const currentPermissionCount = user.permissions ? user.permissions.length : 0;
      
      console.log(`      ${roleIcon} ${user.name} (${user.email})`);
      console.log(`         Role: ${user.role}`);
      console.log(`         Current Permissions: ${currentPermissionCount}`);
      
      if (user.role === 'tenant_admin') {
        // Calculate expected permissions for admin
        const packageFeatures = user.features || [];
        const defaultFeatures = ['dashboard_analytics', 'venue_management', 'customer_management', 'payment_processing'];
        
        const basePermissions = ['dashboard_view', 'dashboard_edit', 'venue_view', 'venue_create', 'venue_edit', 'venue_delete', 'customer_view', 'customer_create', 'customer_edit', 'customer_delete', 'payment_view', 'payment_process', 'user_view', 'user_create', 'user_edit', 'user_delete', 'settings_view', 'settings_edit'];
        let expectedPermissions = [...basePermissions];
        
        if (packageFeatures.includes('event_booking')) expectedPermissions.push('event_view', 'event_create', 'event_edit', 'event_delete');
        if (packageFeatures.includes('proposal_system')) expectedPermissions.push('proposal_view', 'proposal_create', 'proposal_edit', 'proposal_delete');
        if (packageFeatures.includes('advanced_reports')) expectedPermissions.push('report_view', 'report_export', 'advanced_report_access');
        if (packageFeatures.includes('ai_analytics')) expectedPermissions.push('ai_analytics_view', 'ai_insights_access');
        if (packageFeatures.includes('leads_management')) expectedPermissions.push('lead_view', 'lead_create', 'lead_edit', 'lead_delete');
        if (packageFeatures.includes('voice_booking')) expectedPermissions.push('voice_booking_access');
        if (packageFeatures.includes('floor_plans')) expectedPermissions.push('floor_plan_view', 'floor_plan_edit');
        if (packageFeatures.includes('task_management')) expectedPermissions.push('task_view', 'task_create', 'task_edit', 'task_delete');
        if (packageFeatures.includes('custom_fields')) expectedPermissions.push('custom_field_create', 'custom_field_edit');
        
        console.log(`         ✅ Should Auto-Get: ${expectedPermissions.length} permissions (all within package scope)`);
      } else {
        console.log(`         ⚙️  Should Get: Custom permissions based on role needs`);
      }
    });

    console.log('\n\n🧪 PERMISSION SYSTEM TESTING GUIDE:\n');
    
    console.log('🎯 WHAT TO TEST:');
    console.log('1. Go to Super Admin Dashboard: http://localhost:5006/super-admin');
    console.log('2. Login as admin@yourdomain.com / admin123');
    console.log('3. Click "more" (•••) button next to any tenant');
    console.log('4. Go to "Users" tab and test different scenarios:');
    
    console.log('\n📋 TEST SCENARIOS:\n');
    
    console.log('🔹 ADMIN USER PERMISSIONS:');
    console.log('   • Click "View Permissions" (👁️) on tenant_admin user');
    console.log('   • Should see: "Admin User: Automatically has all permissions within package scope"');
    console.log('   • Should show ALL permissions available for their package features');
    console.log('   • Permissions should have green badges with "(Auto)" label');
    
    console.log('\n🔹 ADMIN EDIT PERMISSIONS:');
    console.log('   • Click "Edit Permissions" (✏️) on tenant_admin user');
    console.log('   • Should see: Green notice about auto-granted admin permissions');
    console.log('   • Should see: All toggles pre-selected and DISABLED');
    console.log('   • Should see: "(Auto)" labels and green styling on permission names');
    console.log('   • Should see: Yellow tip box explaining admin auto-permissions');
    
    console.log('\n🔹 REGULAR USER PERMISSIONS:');
    console.log('   • Click "Edit Permissions" (✏️) on tenant_user');
    console.log('   • Should see: Blue notice about package feature restrictions');
    console.log('   • Should see: Toggles ENABLED and customizable');
    console.log('   • Should see: Only permissions for package features available');
    console.log('   • Should NOT see: Permissions for features not in their package');
    
    console.log('\n🔹 PACKAGE FEATURE SYNC:');
    console.log('   • Test with tenant that has "Enterprise Test" package (all features)');
    console.log('   • Should see: ~31 permissions available');
    console.log('   • Test with tenant that has "Basic Test" package (limited features)');
    console.log('   • Should see: ~22 permissions available (less than Enterprise)');
    console.log('   • Test with tenant that has no package');
    console.log('   • Should see: ~18 base permissions only');

    console.log('\n✅ SUCCESS CRITERIA:');
    console.log('• Admin users automatically get ALL permissions within their package scope');
    console.log('• Regular users can be assigned custom permissions within package limits');
    console.log('• Permission lists are dynamically filtered by package features');
    console.log('• Different packages show different permission counts');
    console.log('• Admin permission toggles are disabled (auto-granted)');
    console.log('• User permission toggles are enabled (customizable)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testPermissionSync();