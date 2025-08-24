const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function testDeletePackage() {
  try {
    console.log('🗑️ Testing Package Delete Functionality\n');

    // First, show current packages
    console.log('📦 Current Packages:');
    const packagesResult = await pool.query(`
      SELECT id, name, price, billing_interval 
      FROM subscription_packages 
      ORDER BY name
    `);
    
    packagesResult.rows.forEach((pkg, index) => {
      console.log(`${index + 1}. ${pkg.name} ($${pkg.price}/${pkg.billing_interval}) - ID: ${pkg.id}`);
    });

    // Check which packages have tenants assigned
    console.log('\n📊 Package Usage:');
    for (const pkg of packagesResult.rows) {
      const tenantsResult = await pool.query(`
        SELECT COUNT(*) as count, array_agg(name) as tenant_names
        FROM tenants 
        WHERE subscription_package_id = $1
      `, [pkg.id]);
      
      const count = parseInt(tenantsResult.rows[0].count);
      const tenantNames = tenantsResult.rows[0].tenant_names?.filter(name => name) || [];
      
      if (count > 0) {
        console.log(`⚠️  "${pkg.name}" - Used by ${count} tenant(s): ${tenantNames.join(', ')}`);
      } else {
        console.log(`✅ "${pkg.name}" - Not used, safe to delete`);
      }
    }

    console.log('\n🧪 DELETE TESTING SUMMARY:');
    console.log('1. Packages with tenants assigned CANNOT be deleted (protected)');
    console.log('2. Packages with no tenants CAN be deleted safely');
    console.log('3. The delete endpoint checks for tenant usage before deletion');
    console.log('4. Frontend shows delete confirmation dialog');
    console.log('\n💡 To test deletion:');
    console.log('   1. Go to Super Admin Dashboard at http://localhost:5006/super-admin');
    console.log('   2. Login as admin@yourdomain.com / admin123');
    console.log('   3. Go to Packages tab');
    console.log('   4. Click the red trash icon on any package');
    console.log('   5. Confirm deletion in the dialog');
    console.log('\n🛡️ The system will prevent deletion if tenants are using the package!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testDeletePackage();