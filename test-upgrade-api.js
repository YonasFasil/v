const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testUpgradeAPI() {
  try {
    console.log('🧪 Testing upgrade package API data structure...\n');

    // Get a test tenant
    const tenantResult = await pool.query('SELECT * FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found in database');
      return;
    }

    const tenant = tenantResult.rows[0];
    console.log('📋 Test tenant:', tenant.name, '(ID:', tenant.id + ')');
    console.log('📦 Subscription package ID:', tenant.subscription_package_id);

    // Get subscription package details
    const packageResult = await pool.query('SELECT * FROM subscription_packages WHERE id = $1', [tenant.subscription_package_id]);
    if (packageResult.rows.length > 0) {
      const pkg = packageResult.rows[0];
      console.log('\n📦 Current package details:');
      console.log('   Name:', pkg.name);
      console.log('   Price:', pkg.price);
      console.log('   Features:', pkg.features);
      console.log('   Limits:', pkg.limits);
    }

    // Simulate what tenant-features API should return
    console.log('\n🔧 Expected API response structure:');
    const apiResponse = {
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subscriptionPackageId: tenant.subscription_package_id
      },
      package: packageResult.rows[0] || null,
      features: {
        all: [],
        enabled: [],
        disabled: [],
        summary: {
          enabled: 0,
          total: 0,
          percentage: 0
        }
      }
    };

    console.log(JSON.stringify(apiResponse, null, 2));

    // Get all available subscription packages for upgrade options
    const allPackagesResult = await pool.query('SELECT * FROM subscription_packages WHERE is_active = true ORDER BY price ASC');
    console.log('\n📋 Available subscription packages:');
    allPackagesResult.rows.forEach(pkg => {
      console.log(`   ${pkg.name}: $${pkg.price}/month - ${pkg.features ? pkg.features.length : 0} features`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testUpgradeAPI();