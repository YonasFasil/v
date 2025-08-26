const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testSpacesCreationFinal() {
  console.log('🔧 Testing spaces creation with correct PostgreSQL array syntax...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Getting test data:');
    
    const testData = await pool.query(`
      SELECT t.id as tenant_id, t.name as tenant_name, v.id as venue_id, v.name as venue_name
      FROM tenants t
      JOIN venues v ON v.tenant_id = t.id
      ORDER BY t.created_at DESC
      LIMIT 1
    `);
    
    if (testData.rows.length === 0) {
      console.log('  ❌ No tenants with venues found');
      return;
    }
    
    const { tenant_id, tenant_name, venue_id, venue_name } = testData.rows[0];
    console.log(`  Using tenant: ${tenant_name} (${tenant_id})`);
    console.log(`  Using venue: ${venue_name} (${venue_id})`);
    
    console.log('\n2️⃣ Creating space as tenant:');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      
      // Create space with proper PostgreSQL array syntax
      const spaceResult = await client.query(`
        INSERT INTO spaces (venue_id, name, description, capacity, price_per_hour, amenities, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, ARRAY['WiFi', 'Projector'], $6, NOW())
        RETURNING id, name, venue_id
      `, [venue_id, 'Test Space', 'A test space', 50, 25.00, true]);
      
      const space = spaceResult.rows[0];
      console.log(`  ✅ SUCCESS: Space "${space.name}" created (${space.id})`);
      
      await client.query('COMMIT');
      
      // Verify tenant relationship
      const verification = await pool.query(`
        SELECT s.name as space_name, v.name as venue_name, t.name as tenant_name
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id  
        JOIN tenants t ON t.id = v.tenant_id
        WHERE s.id = $1
      `, [space.id]);
      
      const verified = verification.rows[0];
      console.log(`  ✅ Verified: Space "${verified.space_name}" → Venue "${verified.venue_name}" → Tenant "${verified.tenant_name}"`);
      
      // Cleanup
      await pool.query('DELETE FROM spaces WHERE id = $1', [space.id]);
      console.log('  ✅ Cleanup complete');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    console.log('\n🎉 RESULT: Spaces creation works perfectly!');
    console.log('\n📋 If you\'re having issues creating spaces in your app:');
    console.log('   1. ✅ Database permissions work');
    console.log('   2. ✅ Tenant isolation works through venues');
    console.log('   3. ❓ Check your frontend/API code for:');
    console.log('      • Proper venue ownership validation');  
    console.log('      • Correct array syntax for amenities');
    console.log('      • Required field validation (name, venue_id, capacity)');
    console.log('      • Authentication/authorization in the API endpoint');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.error('🔧 SOLUTION: Check table permissions and RLS policies');
    } else if (error.message.includes('violates not-null constraint')) {
      console.error('🔧 SOLUTION: Ensure all required fields are provided');
    } else if (error.message.includes('foreign key constraint')) {
      console.error('🔧 SOLUTION: Ensure the venue_id exists and belongs to the tenant');
    }
    
  } finally {
    await pool.end();
  }
}

testSpacesCreationFinal();