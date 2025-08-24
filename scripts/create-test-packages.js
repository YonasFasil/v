const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function createTestPackages() {
  try {
    console.log('📦 Creating proper test packages for testing...\n');

    // Create test packages with correct new features
    const packages = [
      {
        name: 'Basic Test',
        description: 'Essential features - Only Event Booking & Proposals',
        price: '29.00',
        billingInterval: 'monthly',
        maxVenues: 1,
        maxUsers: 3,
        features: ['event_booking', 'proposal_system'],
        sortOrder: 1
      },
      {
        name: 'Pro Test', 
        description: 'Professional features - Includes AI & Reports',
        price: '79.00',
        billingInterval: 'monthly',
        maxVenues: 5,
        maxUsers: 10,
        features: ['event_booking', 'proposal_system', 'leads_management', 'ai_analytics', 'advanced_reports'],
        sortOrder: 2
      },
      {
        name: 'Enterprise Test',
        description: 'All features available',
        price: '199.00', 
        billingInterval: 'monthly',
        maxVenues: 999,
        maxUsers: 999,
        features: ['event_booking', 'proposal_system', 'leads_management', 'ai_analytics', 'voice_booking', 'floor_plans', 'advanced_reports', 'task_management', 'custom_fields'],
        sortOrder: 3
      }
    ];

    const createdPackages = [];
    
    for (const pkg of packages) {
      const result = await pool.query(`
        INSERT INTO subscription_packages 
        (name, description, price, billing_interval, max_venues, max_users, features, is_active, sort_order, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW())
        RETURNING id, name
      `, [
        pkg.name,
        pkg.description, 
        pkg.price,
        pkg.billingInterval,
        pkg.maxVenues,
        pkg.maxUsers,
        JSON.stringify(pkg.features),
        pkg.sortOrder
      ]);
      
      createdPackages.push(result.rows[0]);
      console.log(`✅ Created package: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
    }

    // Start with Basic Test package for our test tenant
    const basicTestId = createdPackages.find(p => p.name === 'Basic Test').id;
    await pool.query(`
      UPDATE tenants 
      SET subscription_package_id = $1 
      WHERE slug = 'test'
    `, [basicTestId]);

    console.log(`\n✅ Assigned "Basic Test" package to test tenant\n`);

    // Show all available packages for testing
    console.log('📋 All Available Packages for Testing:');
    const allPackages = await pool.query(`
      SELECT id, name, price, billing_interval, max_venues, max_users, features 
      FROM subscription_packages 
      WHERE is_active = true
      ORDER BY sort_order
    `);

    allPackages.rows.forEach((pkg, index) => {
      console.log(`\n${index + 1}. ${pkg.name}: $${pkg.price}/${pkg.billing_interval}`);
      console.log(`   Limits: ${pkg.max_venues} venues, ${pkg.max_users} users`);
      console.log(`   Features: ${pkg.features.join(', ')}`);
      console.log(`   Package ID: ${pkg.id}`);
    });

    console.log(`\n🧪 TEST PLAN:`);
    console.log(`1. Login to: http://localhost:5006/test`);
    console.log(`   Email: yonasfasil.sl@gmail.com`);
    console.log(`   Password: VenueAdmin2024!`);
    console.log(`\n2. Current Package: Basic Test (only event_booking + proposal_system)`);
    console.log(`3. Test that you can ONLY access Event Booking & Proposal features`);
    console.log(`4. Test that AI Analytics, Advanced Reports, etc. are blocked`);
    console.log(`\n5. Switch to different packages via super admin and retest`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

createTestPackages();