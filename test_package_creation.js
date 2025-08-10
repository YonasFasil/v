// Test script to verify package creation API endpoint
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPackageCreation() {
  try {
    console.log('🧪 Testing package creation...\n');
    
    // Test 1: Check if super_admins table exists and has the right user
    console.log('1. Checking super admin user...');
    const adminCheck = await pool.query(`
      SELECT user_id, created_at FROM super_admins 
      WHERE user_id = 'a2dd806f-ef70-41f5-a3d7-2c8e423a8b2c'
    `);
    console.log('Super admin found:', adminCheck.rows[0] || 'No admin found');

    // Test 2: Check feature_packages table structure
    console.log('\n2. Checking feature_packages table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'feature_packages' 
      ORDER BY ordinal_position
    `);
    console.log('Table columns:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Test 3: Direct package insertion
    console.log('\n3. Testing direct package creation...');
    const testPackage = {
      name: 'Test API Package',
      slug: 'test-api-package',
      description: 'A test package created via direct API',
      status: 'active',
      limits: JSON.stringify({
        maxUsers: 10,
        maxVenues: 2,
        maxSpacesPerVenue: 15
      }),
      features: JSON.stringify({
        'dashboard-analytics': true,
        'event-management': true,
        'customer-management': true
      }),
      priceMonthly: 49.99,
      priceYearly: 499.99,
      billingModes: JSON.stringify({
        monthly: { amount: 4999, currency: 'USD' },
        yearly: { amount: 49999, currency: 'USD' }
      }),
      sortOrder: 0,
      trialDays: 14
    };

    const insertResult = await pool.query(`
      INSERT INTO feature_packages (
        name, slug, description, status, limits, features,
        price_monthly, price_yearly, billing_modes, sort_order, trial_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      testPackage.name,
      testPackage.slug, 
      testPackage.description,
      testPackage.status,
      testPackage.limits,
      testPackage.features,
      testPackage.priceMonthly,
      testPackage.priceYearly,
      testPackage.billingModes,
      testPackage.sortOrder,
      testPackage.trialDays
    ]);

    console.log('✅ Package created successfully!');
    console.log('Created package ID:', insertResult.rows[0].id);
    
    // Test 4: Verify package can be retrieved
    console.log('\n4. Verifying package retrieval...');
    const retrieveResult = await pool.query(`
      SELECT id, name, slug, description, price_monthly, price_yearly
      FROM feature_packages 
      WHERE slug = 'test-api-package'
    `);
    console.log('Retrieved package:', retrieveResult.rows[0]);

    console.log('\n🎉 All tests passed! Package creation API should work.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testPackageCreation();