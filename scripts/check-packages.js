const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function checkPackages() {
  try {
    console.log('📦 Available Packages:');
    const packagesResult = await pool.query(`
      SELECT id, name, price, billing_interval, max_venues, max_users, features, is_active 
      FROM subscription_packages 
      ORDER BY name
    `);
    
    packagesResult.rows.forEach(pkg => {
      console.log(`\n🔹 ${pkg.name}: $${pkg.price}/${pkg.billing_interval}`);
      console.log(`   Venues: ${pkg.max_venues}, Users: ${pkg.max_users}, Active: ${pkg.is_active}`);
      console.log(`   Features: ${JSON.stringify(pkg.features, null, 2)}`);
      console.log(`   Package ID: ${pkg.id}`);
    });

    console.log('\n\n🧪 Test Tenant Current Status:');
    const tenantResult = await pool.query(`
      SELECT t.name, t.slug, t.subscription_package_id, sp.name as package_name, sp.features, u.email
      FROM tenants t 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
      LEFT JOIN users u ON u.tenant_id = t.id
      WHERE u.email = 'yonasfasil.sl@gmail.com'
    `);
    
    if (tenantResult.rows.length > 0) {
      const tenant = tenantResult.rows[0];
      console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`Current Package: ${tenant.package_name || 'None'}`);
      console.log(`Current Features: ${JSON.stringify(tenant.features, null, 2)}`);
      console.log(`Email: ${tenant.email}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkPackages();