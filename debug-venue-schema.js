const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function debugVenueSchema() {
  try {
    console.log('🔍 Checking venues table schema...');

    // Get table schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'venues'
      ORDER BY ordinal_position
    `);

    console.log('📋 Venues table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check for JSON fields specifically
    const jsonFields = schemaResult.rows.filter(col =>
      col.data_type === 'json' || col.data_type === 'jsonb'
    );

    console.log('\n🧬 JSON/JSONB fields:');
    jsonFields.forEach(field => {
      console.log(`   ⚠️  ${field.column_name}: ${field.data_type}`);
    });

    if (jsonFields.length === 0) {
      console.log('   ✅ No JSON/JSONB fields found');
    }

    console.log('\n💡 This will help identify which fields are causing the JSON syntax error');

  } catch (error) {
    console.error('❌ Error checking venue schema:', error);
  } finally {
    await pool.end();
  }
}

debugVenueSchema();