const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function testFeatureRestrictions() {
  try {
    console.log('🔒 Testing Feature Restrictions System\n');

    // Show which users should have limited access
    console.log('🎯 Users with Limited Package Features:');
    const users = await pool.query(`
      SELECT u.name, u.email, t.name as tenant_name, t.slug,
             sp.name as package_name, sp.features
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id 
      WHERE u.role = 'tenant_admin' 
      AND sp.name IN ('Pro Test', 'Basic Test', 'Starter')
      ORDER BY sp.name, u.name
    `);

    users.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Tenant: ${user.tenant_name}`);
      console.log(`   Package: ${user.package_name}`);
      console.log(`   Features: ${user.features ? user.features.join(', ') : 'None'}`);
      
      const features = user.features || [];
      console.log(`\n   🚫 SHOULD NOT SEE:`);
      
      const shouldNotSee = [];
      if (!features.includes('voice_booking')) shouldNotSee.push('Voice Booking');
      if (!features.includes('ai_analytics')) shouldNotSee.push('AI Analytics & Reports'); 
      if (!features.includes('advanced_reports')) shouldNotSee.push('Reports & Analytics');
      if (!features.includes('task_management')) shouldNotSee.push('Tasks & Team');
      if (!features.includes('leads_management')) shouldNotSee.push('Leads');
      if (!features.includes('floor_plans')) shouldNotSee.push('Setup Styles');
      if (!features.includes('proposal_system')) shouldNotSee.push('Proposals');
      
      if (shouldNotSee.length > 0) {
        shouldNotSee.forEach(item => console.log(`      - ${item}`));
      } else {
        console.log(`      - (All features available)`);
      }
      
      console.log(`\n   ✅ SHOULD SEE:`);
      console.log(`      - Dashboard (always available)`);
      console.log(`      - Customers (always available)`);
      console.log(`      - Payments (always available)`);
      console.log(`      - Venues (always available)`);
      console.log(`      - Settings (always available)`);
      console.log(`      - User Management (admin feature)`);
      
      if (features.includes('event_booking')) console.log(`      - Events & Bookings`);
      if (features.includes('voice_booking')) console.log(`      - Voice Booking`);
      if (features.includes('ai_analytics')) console.log(`      - AI Analytics & Reports`);
      if (features.includes('advanced_reports')) console.log(`      - Reports & Analytics`);
      if (features.includes('task_management')) console.log(`      - Tasks & Team`);
      if (features.includes('leads_management')) console.log(`      - Leads`);
      if (features.includes('floor_plans')) console.log(`      - Setup Styles`);
      if (features.includes('proposal_system')) console.log(`      - Proposals`);
    });

    console.log('\n\n🧪 TESTING INSTRUCTIONS:\n');
    
    console.log('1. 🔐 Login to a restricted tenant account:');
    console.log('   • Go to: http://localhost:5006/login');
    console.log('   • Use one of the accounts above (Pro Test, Basic Test, or Starter package)');
    
    console.log('\n2. 🔍 Check the Sidebar Navigation:');
    console.log('   • Look at the left sidebar menu');
    console.log('   • Verify that ONLY the features in "SHOULD SEE" list are visible');
    console.log('   • Verify that features in "SHOULD NOT SEE" list are hidden');
    
    console.log('\n3. 🚫 Test Direct URL Access:');
    console.log('   • Try navigating directly to restricted features (e.g., /voice-booking)');
    console.log('   • Should be blocked by backend API with 403 error');
    console.log('   • Should see upgrade messages for blocked features');
    
    console.log('\n4. 🔄 Compare with Full Access:');
    console.log('   • Login to Enterprise account to see all features');
    console.log('   • Compare sidebar to confirm feature restrictions work');

    console.log('\n\n✅ SUCCESS CRITERIA:');
    console.log('• Tenant with Pro Test package should NOT see Voice Booking in sidebar');
    console.log('• Tenant with Starter package should NOT see AI features, Proposals, etc.');
    console.log('• Direct URL access to restricted features should be blocked');
    console.log('• Enterprise package should see all features');
    console.log('• Backend API should return 403 for restricted feature endpoints');

    console.log('\n\n⚡ KEY TEST CASES:');
    console.log('📧 Pro Test User (yonasfasil.sl@gmail.com):');
    console.log('   - SHOULD see: Events, Proposals, Leads, AI Analytics, Advanced Reports');
    console.log('   - SHOULD NOT see: Voice Booking, Tasks, Floor Plans');
    
    console.log('\n📧 Starter User (yonasfasil.sll@gmail.com):');
    console.log('   - SHOULD see: Basic features only (Dashboard, Customers, Venues, etc.)');
    console.log('   - SHOULD NOT see: Most advanced features');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testFeatureRestrictions();