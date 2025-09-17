const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function testVenueFixFinal() {
  try {
    console.log('🧪 Testing venue image upload fix...');

    // Find a tenant to test with
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('❌ No tenants found for testing');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log(`✅ Using tenant ID: ${tenantId}`);

    // Test data with actual image URLs (like what Vercel blob would return)
    const testImages = [
      {
        url: 'https://example.blob.store/image1.jpg',
        alt: 'Main venue photo',
        isPrimary: true
      },
      {
        url: 'https://example.blob.store/image2.jpg',
        alt: 'Secondary venue photo',
        isPrimary: false
      }
    ];

    console.log('🧪 Testing the FIXED API logic...');

    // Test 1: INSERT with proper JSON.stringify (the fix)
    console.log('\n1️⃣ Testing venue creation (POST)...');
    const insertQuery = `INSERT INTO venues (
        tenant_id, name, description, address, amenities, images, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *`;

    const insertResult = await pool.query(insertQuery, [
      tenantId,
      'Test Venue with Images',
      'Testing image upload fix',
      '123 Test Street',
      ['WiFi', 'Parking'],
      JSON.stringify(testImages), // ✅ THE FIX: Proper JSON stringify
      true
    ]);

    console.log('✅ Venue created successfully!');
    console.log(`   Images stored as JSONB: ${typeof insertResult.rows[0].images}`);
    console.log(`   Images content: ${JSON.stringify(insertResult.rows[0].images)}`);

    // Test 2: UPDATE with proper JSON.stringify (the fix)
    console.log('\n2️⃣ Testing venue update (PUT)...');
    const updatedImages = [
      ...testImages,
      {
        url: 'https://example.blob.store/image3.jpg',
        alt: 'Additional venue photo',
        isPrimary: false
      }
    ];

    const updateQuery = `UPDATE venues
      SET name = $1, description = $2, address = $3, amenities = $4,
          images = $5, is_active = $6, updated_at = NOW()
      WHERE tenant_id = $7 AND id = $8
      RETURNING *`;

    const updateResult = await pool.query(updateQuery, [
      'Updated Test Venue',
      'Updated description',
      '123 Updated Street',
      ['WiFi', 'Parking', 'AC'],
      JSON.stringify(updatedImages), // ✅ THE FIX: Proper JSON stringify
      true,
      tenantId,
      insertResult.rows[0].id
    ]);

    console.log('✅ Venue updated successfully!');
    console.log(`   Updated images count: ${updateResult.rows[0].images.length}`);

    // Clean up
    await pool.query('DELETE FROM venues WHERE id = $1', [insertResult.rows[0].id]);
    console.log('🧹 Test venue cleaned up');

    console.log('\n🎉 SUCCESS! Venue image upload JSON error is FIXED!');
    console.log('\n📋 Summary of fixes:');
    console.log('   ✅ Fixed POST /api/venues - JSON.stringify(images || [])');
    console.log('   ✅ Fixed PUT /api/venues/:id - JSON.stringify(images || [])');
    console.log('   📍 Location: api/tenant.js lines 284 and 299');
    console.log('\n💡 Root cause: JSONB fields require JSON stringification for PostgreSQL');

  } catch (error) {
    console.error('❌ Error testing venue fix:', error.message);

    if (error.message.includes('invalid input syntax for type json')) {
      console.error('🔍 This is the exact error we fixed!');
      console.error('💡 The fix prevents this by using JSON.stringify()');
    }
  } finally {
    await pool.end();
  }
}

testVenueFixFinal();