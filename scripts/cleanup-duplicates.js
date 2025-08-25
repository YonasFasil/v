const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function cleanupDuplicates() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('🧹 Cleaning up duplicate values to allow unique constraints...\n');
    
    // Clean up venues with duplicate names per tenant
    console.log('📋 Cleaning up duplicate venue names...');
    
    const venueCleanup = await pool.query(`
      WITH ranked_venues AS (
        SELECT 
          id,
          tenant_id,
          name,
          ROW_NUMBER() OVER (PARTITION BY tenant_id, name ORDER BY created_at ASC) as rn
        FROM venues 
        WHERE name IS NOT NULL AND name != ''
      ),
      duplicates AS (
        SELECT * FROM ranked_venues WHERE rn > 1
      )
      UPDATE venues 
      SET name = venues.name || ' (' || duplicates.rn || ')'
      FROM duplicates
      WHERE venues.id = duplicates.id
      RETURNING venues.id, venues.name
    `);
    
    console.log(`✅ Updated ${venueCleanup.rows.length} duplicate venue names`);
    venueCleanup.rows.forEach(row => {
      console.log(`   Updated venue ${row.id}: ${row.name}`);
    });
    
    // Check if there are any other potential duplicates to clean up
    const remainingDupes = await pool.query(`
      SELECT 'customers' as table_name, tenant_id, email as value, COUNT(*) as count
      FROM customers 
      WHERE email IS NOT NULL AND email != ''
      GROUP BY tenant_id, email
      HAVING COUNT(*) > 1
      
      UNION ALL
      
      SELECT 'users', tenant_id, email, COUNT(*)
      FROM users 
      WHERE email IS NOT NULL AND email != ''
      GROUP BY tenant_id, email
      HAVING COUNT(*) > 1
      
      UNION ALL
      
      SELECT 'venues', tenant_id, name, COUNT(*)
      FROM venues 
      WHERE name IS NOT NULL AND name != ''
      GROUP BY tenant_id, name
      HAVING COUNT(*) > 1
    `);
    
    console.log(`\n📋 Remaining duplicates after cleanup: ${remainingDupes.rows.length}`);
    remainingDupes.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.value} in tenant ${row.tenant_id} (${row.count} times)`);
    });
    
    if (remainingDupes.rows.length === 0) {
      console.log('\n✅ All duplicates cleaned up! Ready for unique constraints.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupDuplicates();