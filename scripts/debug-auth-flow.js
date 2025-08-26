const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugAuthFlow() {
  console.log('🔍 Debugging authentication flow for spaces visibility...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Let\'s create a space and then immediately check if we can fetch it:');
    
    // Get a tenant and venue for testing
    const testData = await pool.query(`
      SELECT t.id as tenant_id, t.name as tenant_name, v.id as venue_id, v.name as venue_name
      FROM tenants t
      JOIN venues v ON v.tenant_id = t.id
      ORDER BY t.created_at DESC
      LIMIT 1
    `);
    
    if (testData.rows.length === 0) {
      console.log('❌ No test data available');
      return;
    }
    
    const { tenant_id, tenant_name, venue_id, venue_name } = testData.rows[0];
    console.log(`Using tenant: ${tenant_name} (${tenant_id})`);
    console.log(`Using venue: ${venue_name} (${venue_id})`);
    
    // Step 1: Create a space (simulating your successful creation)
    console.log('\n2️⃣ Creating space with proper context (simulating successful creation):');
    
    const client1 = await pool.connect();
    try {
      await client1.query('BEGIN');
      await client1.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client1.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      
      const spaceResult = await client1.query(`
        INSERT INTO spaces (venue_id, name, description, capacity, price_per_hour, amenities, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, ARRAY['Test Amenity'], $6, NOW())
        RETURNING id, name
      `, [venue_id, 'Debug Test Space', 'Created for debugging', 25, 15.00, true]);
      
      const createdSpace = spaceResult.rows[0];
      console.log(`✅ Space created: ${createdSpace.name} (ID: ${createdSpace.id})`);
      
      await client1.query('COMMIT');
      
      // Step 2: Immediately try to fetch spaces with same context
      console.log('\n3️⃣ Immediately fetching spaces with same context:');
      
      await client1.query('BEGIN');
      await client1.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client1.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      
      const fetchResult = await client1.query(`
        SELECT s.id, s.name, s.venue_id
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        WHERE v.tenant_id = $1
        ORDER BY s.created_at DESC
      `, [tenant_id]);
      
      console.log(`Found ${fetchResult.rows.length} spaces for tenant:`);
      fetchResult.rows.forEach(space => {
        console.log(`  • ${space.name} (${space.id === createdSpace.id ? 'JUST CREATED' : 'existing'})`);
      });
      
      await client1.query('ROLLBACK');
      
    } finally {
      client1.release();
    }
    
    // Step 3: Test what happens with a fresh connection (simulating page refresh)
    console.log('\n4️⃣ Testing with fresh connection (simulating page refresh/new API call):');
    
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      await client2.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client2.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      
      const freshFetch = await client2.query(`
        SELECT s.id, s.name, s.venue_id
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        WHERE v.tenant_id = $1
        ORDER BY s.created_at DESC
      `, [tenant_id]);
      
      console.log(`Fresh connection found ${freshFetch.rows.length} spaces:`);
      freshFetch.rows.forEach(space => {
        console.log(`  • ${space.name}`);
      });
      
      await client2.query('ROLLBACK');
      
    } finally {
      client2.release();
    }
    
    // Step 4: Test what happens without proper context (this might be your issue)
    console.log('\n5️⃣ Testing without proper tenant context (this might be your bug):');
    
    const client3 = await pool.connect();
    try {
      await client3.query('BEGIN');
      // DON'T set tenant context - simulate the bug
      
      const noContextFetch = await client3.query(`
        SELECT s.id, s.name, s.venue_id
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        WHERE v.tenant_id = $1
      `, [tenant_id]);
      
      console.log(`❓ Without context: ${noContextFetch.rows.length} spaces found`);
      
      // Test what your storage function might be doing
      const emptyResult = await client3.query('SELECT COUNT(*) FROM spaces WHERE false');
      console.log(`Empty result simulation: ${emptyResult.rows[0].count} spaces`);
      
      await client3.query('ROLLBACK');
      
    } finally {
      client3.release();
    }
    
    console.log('\n6️⃣ Testing the actual storage.getSpaces() logic:');
    
    // Simulate what happens in storage.getSpaces() when context is missing
    const client4 = await pool.connect();
    try {
      await client4.query('BEGIN');
      
      // Check if tenant context exists
      let tenantFromContext;
      try {
        const contextResult = await client4.query("SELECT current_setting('app.current_tenant', true)");
        tenantFromContext = contextResult.rows[0].current_setting;
      } catch (e) {
        tenantFromContext = null;
      }
      
      console.log(`Tenant from context: ${tenantFromContext || 'NOT SET'}`);
      
      if (!tenantFromContext) {
        console.log('🎯 THIS IS THE ISSUE: No tenant context, so getSpaces() returns empty array');
        console.log('   storage.getSpaces() has this logic:');
        console.log('   if (!context.tenantId) { return []; }');
      } else {
        console.log('✅ Tenant context is properly set');
      }
      
      await client4.query('ROLLBACK');
      
    } finally {
      client4.release();
    }
    
    // Cleanup the test space
    await pool.query('DELETE FROM spaces WHERE name = $1', ['Debug Test Space']);
    
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('If spaces don\'t show after refresh, the issue is likely:');
    console.log('1. ❌ Frontend API call lacks proper Authorization header');
    console.log('2. ❌ tenantContextMiddleware not setting tenant context correctly');
    console.log('3. ❌ Token is invalid/expired');
    console.log('4. ❌ User session lost tenant information');
    
    console.log('\n🔧 IMMEDIATE CHECKS NEEDED:');
    console.log('1. Open browser DevTools → Network tab');
    console.log('2. Refresh the page and look for /api/spaces request');
    console.log('3. Check if Authorization header is present');
    console.log('4. Check server logs for "WARNING: getSpaces() called without proper tenant context"');
    console.log('5. Check if the request returns [] (empty array)');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugAuthFlow();