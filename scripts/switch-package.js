const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function switchPackage() {
  try {
    const packageName = process.argv[2];
    
    if (!packageName) {
      console.log('📋 Available test packages:');
      const packages = await pool.query(`
        SELECT name, price, billing_interval, features 
        FROM subscription_packages 
        WHERE name LIKE '%Test%' 
        ORDER BY price::decimal
      `);
      
      packages.rows.forEach((pkg, index) => {
        console.log(`${index + 1}. "${pkg.name}" - $${pkg.price}/${pkg.billing_interval}`);
        console.log(`   Features: ${pkg.features.join(', ')}\n`);
      });
      
      console.log('Usage: node switch-package.js "Basic Test"');
      console.log('       node switch-package.js "Pro Test"');
      console.log('       node switch-package.js "Enterprise Test"');
      return;
    }

    // Find the package
    const packageResult = await pool.query(`
      SELECT id, name, features 
      FROM subscription_packages 
      WHERE name = $1
    `, [packageName]);

    if (packageResult.rows.length === 0) {
      console.log(`❌ Package "${packageName}" not found`);
      return;
    }

    const selectedPackage = packageResult.rows[0];

    // Switch the test tenant to this package
    await pool.query(`
      UPDATE tenants 
      SET subscription_package_id = $1 
      WHERE slug = 'test'
    `, [selectedPackage.id]);

    console.log(`✅ Switched test tenant to package: ${selectedPackage.name}`);
    console.log(`🎯 Available Features: ${selectedPackage.features.join(', ')}`);
    console.log(`🌐 Test at: http://localhost:5006/test`);
    console.log(`📧 Email: yonasfasil.sl@gmail.com`);
    console.log(`🔑 Password: VenueAdmin2024!`);

    // Show what should be accessible vs blocked
    const allFeatures = [
      'event_booking', 'proposal_system', 'leads_management', 
      'ai_analytics', 'voice_booking', 'floor_plans', 
      'advanced_reports', 'task_management', 'custom_fields'
    ];

    console.log(`\n✅ Should be ACCESSIBLE:`);
    console.log(`   - Dashboard & Analytics (always available)`);
    console.log(`   - Venue Management (always available)`);
    console.log(`   - Customer Management (always available)`);
    console.log(`   - Payment Processing (always available)`);
    selectedPackage.features.forEach(feature => {
      console.log(`   - ${feature.replace('_', ' ')}`);
    });

    console.log(`\n❌ Should be BLOCKED:`);
    const blockedFeatures = allFeatures.filter(f => !selectedPackage.features.includes(f));
    if (blockedFeatures.length > 0) {
      blockedFeatures.forEach(feature => {
        console.log(`   - ${feature.replace('_', ' ')}`);
      });
    } else {
      console.log(`   - None (Enterprise package has all features)`);
    }

    console.log(`\n🧪 TEST ROUTES TO CHECK:`);
    if (selectedPackage.features.includes('ai_analytics')) {
      console.log(`✅ /api/ai/analytics - Should work`);
    } else {
      console.log(`❌ /api/ai/analytics - Should return 403`);
    }

    if (selectedPackage.features.includes('advanced_reports')) {
      console.log(`✅ /api/reports/analytics - Should work`);
    } else {
      console.log(`❌ /api/reports/analytics - Should return 403`);
    }

    if (selectedPackage.features.includes('voice_booking')) {
      console.log(`✅ /api/ai/process-voice-booking - Should work`);
    } else {
      console.log(`❌ /api/ai/process-voice-booking - Should return 403`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

switchPackage();