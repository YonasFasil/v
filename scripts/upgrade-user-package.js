const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function upgradeUserToHighestPackage() {
  try {
    console.log('🔄 Upgrading yonasfasil.sl@gmail.com to highest package...\n');

    // First, let's see what packages have the most features
    const packages = await pool.query(`
      SELECT name, features, 
             CASE WHEN features IS NULL THEN 0 ELSE jsonb_array_length(features) END as feature_count 
      FROM subscription_packages 
      WHERE is_active = true 
      ORDER BY feature_count DESC, name
    `);

    console.log('📦 Available Packages (by feature count):');
    packages.rows.forEach((pkg, i) => {
      console.log(`${i + 1}. ${pkg.name}: ${pkg.feature_count || 0} features`);
      if (pkg.features) {
        console.log(`   Features: ${pkg.features.join(', ')}`);
      }
      console.log('');
    });

    // Find the package with the most features or "all_features"
    const bestPackage = packages.rows.find(pkg => 
      pkg.features && (pkg.features.includes('all_features') || pkg.feature_count >= 10)
    ) || packages.rows[0];

    console.log(`🎯 Selected best package: ${bestPackage.name} (${bestPackage.feature_count} features)`);

    // Update the user's tenant to use this package
    const updateResult = await pool.query(`
      UPDATE tenants 
      SET subscription_package_id = (
        SELECT id FROM subscription_packages 
        WHERE name = $1 AND is_active = true 
        LIMIT 1
      )
      WHERE id = (
        SELECT tenant_id FROM users 
        WHERE email = 'yonasfasil.sl@gmail.com'
      )
      RETURNING name, subscription_package_id
    `, [bestPackage.name]);

    if (updateResult.rows.length > 0) {
      console.log(`✅ Successfully upgraded tenant "${updateResult.rows[0].name}" to package "${bestPackage.name}"`);
      
      // Verify the change
      const verification = await pool.query(`
        SELECT u.email, u.name, t.name as tenant_name, sp.name as package_name, sp.features 
        FROM users u 
        LEFT JOIN tenants t ON u.tenant_id = t.id 
        LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id 
        WHERE u.email = 'yonasfasil.sl@gmail.com'
      `);

      console.log('\n🔍 Verification:');
      const user = verification.rows[0];
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Tenant: ${user.tenant_name}`);
      console.log(`New Package: ${user.package_name}`);
      console.log(`New Features: ${user.features ? user.features.join(', ') : 'None'}`);
      console.log(`Feature Count: ${user.features ? user.features.length : 0}`);

    } else {
      console.log('❌ Failed to update package - user or tenant not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

upgradeUserToHighestPackage();