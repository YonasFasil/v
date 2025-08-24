const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

// All possible features that should be available
const ALL_EXPECTED_FEATURES = [
  'dashboard_analytics', 'venue_management', 'event_booking', 'customer_management', 
  'proposal_system', 'payment_processing', 'leads_management', 'ai_analytics', 
  'voice_booking', 'floor_plans', 'advanced_reports', 'task_management',
  'custom_branding', 'api_access', 'priority_support', 'advanced_integrations', 
  'multi_location', 'custom_fields'
];

// Navigation items that should be visible
const EXPECTED_NAVIGATION = [
  { name: "Dashboard", feature: null }, // Always available
  { name: "Events & Bookings", feature: "event_booking" },
  { name: "Customers", feature: null }, // Always available  
  { name: "Leads", feature: "leads_management" },
  { name: "Proposals", feature: "proposal_system" },
  { name: "Payments", feature: null }, // Always available
  { name: "Tasks & Team", feature: "task_management" },
  { name: "Venues", feature: null }, // Always available
  { name: "Setup Styles", feature: "floor_plans" },
  { name: "Packages & Services", feature: null }, // Always available
  { name: "AI Analytics & Reports", feature: "ai_analytics" },
  { name: "Voice Booking", feature: "voice_booking" },
  { name: "Reports & Analytics", feature: "advanced_reports" },
  { name: "Settings", feature: null }, // Always available
  { name: "User Management", feature: null } // Admin feature
];

async function testFullFeatureAccess() {
  try {
    console.log('🧪 Testing Full Feature Access for yonasfasil.sl@gmail.com\n');

    // Get current user package and features
    const userQuery = await pool.query(`
      SELECT u.email, u.name, u.role, t.name as tenant_name, t.slug,
             sp.name as package_name, sp.features 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id 
      WHERE u.email = 'yonasfasil.sl@gmail.com'
    `);

    if (userQuery.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = userQuery.rows[0];
    console.log('👤 User Information:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant: ${user.tenant_name}`);
    console.log(`   Package: ${user.package_name}`);
    console.log(`   Feature Count: ${user.features ? user.features.length : 0}`);

    if (!user.features) {
      console.log('❌ No features found for this user!');
      return;
    }

    console.log('\n🔍 Feature Analysis:');

    // Check which expected features are missing
    const missingFeatures = ALL_EXPECTED_FEATURES.filter(feature => 
      !user.features.includes(feature)
    );

    const extraFeatures = user.features.filter(feature => 
      !ALL_EXPECTED_FEATURES.includes(feature)
    );

    console.log(`✅ Available Features (${user.features.length}):`);
    user.features.forEach(feature => {
      console.log(`   - ${feature}`);
    });

    if (missingFeatures.length > 0) {
      console.log(`\n❌ Missing Features (${missingFeatures.length}):`);
      missingFeatures.forEach(feature => {
        console.log(`   - ${feature}`);
      });
    } else {
      console.log(`\n✅ All expected features are available!`);
    }

    if (extraFeatures.length > 0) {
      console.log(`\n➕ Extra Features (${extraFeatures.length}):`);
      extraFeatures.forEach(feature => {
        console.log(`   - ${feature}`);
      });
    }

    console.log('\n🧭 Navigation Items Analysis:');
    console.log('Should be visible in sidebar:');

    EXPECTED_NAVIGATION.forEach(nav => {
      const shouldShow = !nav.feature || user.features.includes(nav.feature);
      const status = shouldShow ? '✅' : '❌';
      const reason = nav.feature ? `(requires: ${nav.feature})` : '(always available)';
      console.log(`   ${status} ${nav.name} ${reason}`);
    });

    console.log('\n🎯 TESTING INSTRUCTIONS:');
    console.log('1. Login as yonasfasil.sl@gmail.com at http://localhost:5006/login');
    console.log('2. Check the sidebar - ALL navigation items above should be visible');
    console.log('3. Test accessing all features - none should be blocked');
    console.log('4. Try voice booking, AI analytics, advanced reports, etc.');
    
    if (missingFeatures.length === 0 && user.features.length >= 15) {
      console.log('\n🎉 SUCCESS: User has complete feature access!');
    } else {
      console.log('\n⚠️  WARNING: User may have limited access');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testFullFeatureAccess();