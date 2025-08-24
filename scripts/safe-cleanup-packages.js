const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function safeCleanupPackages() {
  try {
    console.log('🧹 Safely cleaning up packages and creating proper test packages...\n');

    // First, set all tenants to have no package
    await pool.query('UPDATE tenants SET subscription_package_id = NULL');
    console.log('✅ Removed package assignments from all tenants\n');

    // Now safely delete all packages
    await pool.query('DELETE FROM subscription_packages');
    console.log('✅ Removed all old packages\n');

    // Create proper test packages with correct features
    const packages = [
      {
        name: 'Basic',
        description: 'Essential features for small venues',
        price: '29.00',
        billingInterval: 'monthly',
        maxVenues: 1,
        maxUsers: 3,
        features: ['event_booking', 'proposal_system'],
        sortOrder: 1
      },
      {
        name: 'Professional', 
        description: 'Advanced features for growing venues',
        price: '79.00',
        billingInterval: 'monthly',
        maxVenues: 5,
        maxUsers: 10,
        features: ['event_booking', 'proposal_system', 'leads_management', 'ai_analytics', 'advanced_reports'],
        sortOrder: 2
      },
      {
        name: 'Enterprise',
        description: 'All features for large venues',
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

    // Assign Basic package to test tenant
    const basicPackageId = createdPackages.find(p => p.name === 'Basic').id;
    await pool.query(`
      UPDATE tenants 
      SET subscription_package_id = $1 
      WHERE slug = 'test'
    `, [basicPackageId]);

    console.log(`\n✅ Assigned Basic package to test tenant\n`);

    // Show final packages
    console.log('📦 Final Package List:');
    const finalPackages = await pool.query(`
      SELECT name, price, billing_interval, max_venues, max_users, features 
      FROM subscription_packages 
      ORDER BY sort_order
    `);

    finalPackages.rows.forEach(pkg => {
      console.log(`\n🔹 ${pkg.name}: $${pkg.price}/${pkg.billing_interval}`);
      console.log(`   Limits: ${pkg.max_venues} venues, ${pkg.max_users} users`);
      console.log(`   Features: ${pkg.features.join(', ')}`);
    });

    console.log(`\n🔑 Test Account Details:`);
    console.log(`Email: yonasfasil.sl@gmail.com`);
    console.log(`Password: VenueAdmin2024!`);
    console.log(`Tenant: test`);
    console.log(`Current Package: Basic`);
    console.log(`Available at: http://localhost:5006/test`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

safeCleanupPackages();