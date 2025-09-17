const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function debugExistingVenueData() {
  try {
    console.log('🔍 Debugging existing venue data...');

    // Check existing venues with images
    const venuesResult = await pool.query(`
      SELECT id, name, images,
             CASE
               WHEN images IS NULL THEN 'NULL'
               WHEN jsonb_typeof(images) = 'string' THEN 'STRING'
               WHEN jsonb_typeof(images) = 'array' THEN 'ARRAY'
               WHEN jsonb_typeof(images) = 'object' THEN 'OBJECT'
               ELSE 'OTHER'
             END as images_type
      FROM venues
      WHERE images IS NOT NULL
      LIMIT 5
    `);

    console.log('📋 Existing venues with images:');
    venuesResult.rows.forEach((venue, index) => {
      console.log(`\n${index + 1}. Venue: ${venue.name}`);
      console.log(`   ID: ${venue.id}`);
      console.log(`   Images Type: ${venue.images_type}`);
      console.log(`   Images Raw: ${venue.images}`);

      try {
        if (venue.images && typeof venue.images === 'string') {
          const parsed = JSON.parse(venue.images);
          console.log(`   Images Parsed: ${JSON.stringify(parsed, null, 2)}`);
        } else {
          console.log(`   Images (already object): ${JSON.stringify(venue.images, null, 2)}`);
        }
      } catch (parseError) {
        console.log(`   ❌ Parse Error: ${parseError.message}`);
      }
    });

    if (venuesResult.rows.length === 0) {
      console.log('   No venues with images found');
    }

    console.log('\n💡 This shows how images are currently stored in the database');
    console.log('🔧 If images show as "[object Object]", that\'s the root issue');

  } catch (error) {
    console.error('❌ Error debugging venue data:', error);
  } finally {
    await pool.end();
  }
}

debugExistingVenueData();