const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testSpacesApiCall() {
  console.log('🔧 Testing spaces API call to simulate frontend issue...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Direct database query (what should work):');
    
    const directSpaces = await pool.query(`
      SELECT s.id, s.name, s.venue_id, s.is_active,
             v.name as venue_name, v.tenant_id, t.name as tenant_name
      FROM spaces s
      JOIN venues v ON v.id = s.venue_id
      JOIN tenants t ON t.id = v.tenant_id
      ORDER BY s.created_at DESC
    `);
    
    console.log(`Direct query found ${directSpaces.rows.length} spaces:`);
    directSpaces.rows.forEach(space => {
      console.log(`  • ${space.name} (${space.tenant_name})`);
    });
    
    console.log('\n2️⃣ Testing the context-aware query (what the API uses):');
    
    // Get a tenant to test with
    const testTenant = await pool.query('SELECT id, name FROM tenants ORDER BY created_at DESC LIMIT 1');
    const tenantId = testTenant.rows[0]?.id;
    const tenantName = testTenant.rows[0]?.name;
    
    if (!tenantId) {
      console.log('❌ No tenants found to test with');
      return;
    }
    
    console.log(`Testing with tenant: ${tenantName} (${tenantId})`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Simulate the API context setting
      await client.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
      
      // This is what the storage.getSpaces() function should execute
      const contextSpaces = await client.query(`
        SELECT s.id, s.venue_id, s.name, s.description, s.capacity, s.price_per_hour,
               s.amenities, s.image_url, s.available_setup_styles, s.floor_plan,
               s.is_active, s.created_at
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        WHERE v.tenant_id = $1
      `, [tenantId]);
      
      console.log(`Context-aware query found ${contextSpaces.rows.length} spaces for tenant`);
      contextSpaces.rows.forEach(space => {
        console.log(`  • ${space.name} (ID: ${space.id})`);
      });
      
      await client.query('ROLLBACK');
      
    } finally {
      client.release();
    }
    
    console.log('\n3️⃣ Testing what happens without context (simulates the problem):');
    
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      
      // DON'T set context - this simulates the API bug
      const noContextSpaces = await client2.query(`
        SELECT s.id, s.name
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        WHERE v.tenant_id = $1
      `, [tenantId]);
      
      console.log(`Without context: ${noContextSpaces.rows.length} spaces found`);
      
      // This is what might be happening - no tenant filtering
      const allSpaces = await client2.query('SELECT id, name FROM spaces');
      console.log(`All spaces query: ${allSpaces.rows.length} spaces found`);
      
      await client2.query('ROLLBACK');
      
    } finally {
      client2.release();
    }
    
    console.log('\n🎯 LIKELY ISSUES:');
    console.log('1. ❓ Check server console for: "WARNING: getSpaces() called without proper tenant context"');
    console.log('2. ❓ Frontend might be calling /api/spaces without proper authentication header');
    console.log('3. ❓ tenantContextMiddleware might not be setting context properly');
    console.log('4. ❓ Frontend cache/state not refreshing after creation');
    
    console.log('\n🔧 DEBUGGING STEPS:');
    console.log('1. Open browser dev tools → Network tab');
    console.log('2. Try to view spaces list');
    console.log('3. Check if /api/spaces request has Authorization header');
    console.log('4. Check server logs for the WARNING message');
    console.log('5. Check if response shows empty array []');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testSpacesApiCall();