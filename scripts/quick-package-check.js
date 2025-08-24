const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function quickCheck() {
  try {
    // Check packages
    const packages = await pool.query(`SELECT name, features FROM subscription_packages WHERE is_active = true ORDER BY name`);
    console.log('📦 Available Packages:');
    packages.rows.forEach(pkg => {
      console.log(`- ${pkg.name}: ${pkg.features ? pkg.features.join(', ') : 'No features'}`);
    });

    // Find the specific user
    const user = await pool.query(`
      SELECT u.email, u.name, t.name as tenant_name, sp.name as package_name, sp.features 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id 
      WHERE u.email LIKE '%yonasfasil%'
    `);
    
    console.log('\n👤 Yonasfasil User:');
    user.rows.forEach(u => {
      console.log(`- ${u.name} (${u.email})`);
      console.log(`  Tenant: ${u.tenant_name}`);
      console.log(`  Package: ${u.package_name || 'None'}`);
      console.log(`  Features: ${u.features ? u.features.join(', ') : 'None'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickCheck();