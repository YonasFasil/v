const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugSpacesDisplay() {
  console.log('🔍 Debugging spaces display issue (created but not showing)...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking all spaces in database:');
    
    const allSpaces = await pool.query(`
      SELECT s.id, s.name, s.venue_id, s.is_active, s.created_at,
             v.name as venue_name, v.tenant_id, v.is_active as venue_active,
             t.name as tenant_name
      FROM spaces s
      JOIN venues v ON v.id = s.venue_id
      JOIN tenants t ON t.id = v.tenant_id
      ORDER BY s.created_at DESC
    `);
    
    console.log(`Total spaces in database: ${allSpaces.rows.length}`);
    if (allSpaces.rows.length > 0) {
      console.log('Recent spaces:');
      allSpaces.rows.slice(0, 5).forEach(space => {
        console.log(`  • ${space.name} (${space.is_active ? 'Active' : 'Inactive'}) - Venue: ${space.venue_name} - Tenant: ${space.tenant_name}`);
        console.log(`    Created: ${space.created_at}, Space ID: ${space.id}`);
      });
    }
    
    console.log('\n2️⃣ Checking for inactive or filtered spaces:');
    
    const inactiveSpaces = await pool.query(`
      SELECT COUNT(*) as count FROM spaces WHERE is_active = false
    `);
    
    const activeSpaces = await pool.query(`
      SELECT COUNT(*) as count FROM spaces WHERE is_active = true OR is_active IS NULL
    `);
    
    console.log(`Active spaces: ${activeSpaces.rows[0].count}`);
    console.log(`Inactive spaces: ${inactiveSpaces.rows[0].count}`);
    
    console.log('\n3️⃣ Testing space fetching with tenant context:');
    
    // Get a tenant with venues and spaces
    const tenantWithSpaces = await pool.query(`
      SELECT t.id as tenant_id, t.name as tenant_name,
             COUNT(DISTINCT v.id) as venue_count,
             COUNT(s.id) as space_count
      FROM tenants t
      LEFT JOIN venues v ON v.tenant_id = t.id
      LEFT JOIN spaces s ON s.venue_id = v.id
      GROUP BY t.id, t.name
      HAVING COUNT(s.id) > 0
      ORDER BY COUNT(s.id) DESC
      LIMIT 1
    `);
    
    if (tenantWithSpaces.rows.length === 0) {
      console.log('  ❌ No tenants have spaces to test with');
      return;
    }
    
    const { tenant_id, tenant_name, venue_count, space_count } = tenantWithSpaces.rows[0];
    console.log(`  Testing with tenant: ${tenant_name} (${venue_count} venues, ${space_count} spaces)`);
    
    console.log('\n4️⃣ Simulating API call to fetch spaces for tenant:');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      
      // Simulate the query your API might be using
      const spacesForTenant = await client.query(`
        SELECT s.id, s.name, s.description, s.capacity, s.price_per_hour, 
               s.amenities, s.is_active, s.created_at,
               v.id as venue_id, v.name as venue_name
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        WHERE v.tenant_id = $1
          AND (s.is_active = true OR s.is_active IS NULL)
          AND (v.is_active = true OR v.is_active IS NULL)
        ORDER BY s.created_at DESC
      `, [tenant_id]);
      
      console.log(`  Found ${spacesForTenant.rows.length} spaces for tenant`);
      
      if (spacesForTenant.rows.length > 0) {
        console.log('  Spaces that should be displayed:');
        spacesForTenant.rows.forEach((space, index) => {
          console.log(`    ${index + 1}. "${space.name}" in venue "${space.venue_name}"`);
          console.log(`       ID: ${space.id}, Active: ${space.is_active}, Created: ${space.created_at}`);
        });
      }
      
      await client.query('ROLLBACK');
      
    } finally {
      client.release();
    }
    
    console.log('\n5️⃣ Check common filtering issues:');
    
    // Check for spaces created very recently (might not be in cache)
    const recentSpaces = await pool.query(`
      SELECT s.name, s.created_at, v.name as venue_name, t.name as tenant_name
      FROM spaces s
      JOIN venues v ON v.id = s.venue_id
      JOIN tenants t ON t.id = v.tenant_id
      WHERE s.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY s.created_at DESC
    `);
    
    console.log(`Recent spaces (last hour): ${recentSpaces.rows.length}`);
    recentSpaces.rows.forEach(space => {
      console.log(`  • "${space.name}" in "${space.venue_name}" (${space.tenant_name}) - ${space.created_at}`);
    });
    
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('✅ Spaces are being created successfully');
    console.log('✅ Spaces exist in the database');
    console.log('❓ Check your frontend code for:');
    console.log('   • Cache not being refreshed after creation');
    console.log('   • Wrong API endpoint being called for fetching');
    console.log('   • Filtering by is_active or other conditions');  
    console.log('   • React state not updating after successful creation');
    console.log('   • Network request not including proper authentication');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugSpacesDisplay();