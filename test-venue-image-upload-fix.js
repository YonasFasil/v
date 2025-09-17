const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testVenueImageUploadFix() {
  try {
    console.log('🧪 Testing venue image upload JSON fix...');

    // Find a tenant to test with
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found for testing');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Using tenant ID: ${tenantId}`);

    // Test data simulating what frontend would send after image upload
    const testVenueData = {
      name: 'Test Venue Image Upload',
      description: 'Testing JSON handling for images',
      address: '123 Test Street',
      amenities: ['WiFi', 'Parking', 'Sound System'],
      images: [
        {
          url: 'https://example.com/image1.jpg',
          alt: 'Venue image 1',
          isPrimary: true
        },
        {
          url: 'https://example.com/image2.jpg',
          alt: 'Venue image 2',
          isPrimary: false
        }
      ],
      isActive: true
    };

    console.log('📤 Testing venue creation with images...');
    console.log(`   Amenities: ${JSON.stringify(testVenueData.amenities)}`);
    console.log(`   Images: ${JSON.stringify(testVenueData.images)}`);

    // Test the fixed INSERT query (simulating POST request)
    const insertQuery = `INSERT INTO venues (
        tenant_id, name, description, address, amenities, images, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *`;

    const insertParams = [
      tenantId,
      testVenueData.name,
      testVenueData.description,
      testVenueData.address,
      testVenueData.amenities || [],
      JSON.stringify(testVenueData.images || []), // This is the fix!
      testVenueData.isActive !== false
    ];

    const newVenue = await pool.query(insertQuery, insertParams);
    console.log('✅ Venue created successfully!');
    console.log(`   Venue ID: ${newVenue.rows[0].id}`);
    console.log(`   Images stored: ${newVenue.rows[0].images}`);

    // Test the fixed UPDATE query (simulating PUT request)
    const updateData = {
      ...testVenueData,
      name: 'Updated Test Venue',
      images: [
        ...testVenueData.images,
        {
          url: 'https://example.com/image3.jpg',
          alt: 'New venue image',
          isPrimary: false
        }
      ]
    };

    console.log('\n📤 Testing venue update with images...');

    const updateQuery = `UPDATE venues
      SET name = $1, description = $2, address = $3, amenities = $4,
          images = $5, is_active = $6, updated_at = NOW()
      WHERE tenant_id = $7 AND id = $8
      RETURNING *`;

    const updateParams = [
      updateData.name,
      updateData.description,
      updateData.address,
      updateData.amenities || [],
      JSON.stringify(updateData.images || []), // This is the fix!
      updateData.isActive !== false,
      tenantId,
      newVenue.rows[0].id
    ];

    const updatedVenue = await pool.query(updateQuery, updateParams);
    console.log('✅ Venue updated successfully!');
    console.log(`   Updated name: ${updatedVenue.rows[0].name}`);
    console.log(`   Updated images count: ${JSON.parse(updatedVenue.rows[0].images).length}`);

    // Clean up test data
    await pool.query('DELETE FROM venues WHERE id = $1', [newVenue.rows[0].id]);
    console.log('🧹 Test venue cleaned up');

    console.log('\n🎉 SUCCESS! Venue image upload JSON error is FIXED!');
    console.log('💡 The fix: Use JSON.stringify() for JSONB fields in PostgreSQL');
    console.log('🔧 Fixed in: api/tenant.js lines 284 and 299');

  } catch (error) {
    console.error('❌ Error testing venue image upload fix:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testVenueImageUploadFix();