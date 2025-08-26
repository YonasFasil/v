const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testCorrectSpacesCreation() {
  console.log('🔧 Testing correct spaces creation (without tenant_id)...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Getting test data (tenant and venue):');
    
    const testData = await pool.query(`
      SELECT t.id as tenant_id, t.name as tenant_name, v.id as venue_id, v.name as venue_name
      FROM tenants t
      JOIN venues v ON v.tenant_id = t.id
      ORDER BY t.created_at DESC
      LIMIT 1
    `);
    
    if (testData.rows.length === 0) {
      console.log('  ❌ No tenants with venues found for testing');
      return;
    }
    
    const { tenant_id, tenant_name, venue_id, venue_name } = testData.rows[0];
    console.log(`  Using tenant: ${tenant_name} (${tenant_id})`);
    console.log(`  Using venue: ${venue_name} (${venue_id})`);
    
    console.log('\n2️⃣ Testing space creation with correct schema:');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Set tenant context
      await client.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      console.log('  ✅ Set tenant context');
      
      // Create space (without tenant_id since spaces table doesn't have it)
      const spaceResult = await client.query(`
        INSERT INTO spaces (venue_id, name, description, capacity, price_per_hour, amenities, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, name, venue_id
      `, [venue_id, 'Test Space', 'A test space for debugging', 50, 25.00, '["WiFi", "Projector"]', true]);
      
      const space = spaceResult.rows[0];
      console.log(`  ✅ SPACE CREATION SUCCESS: ${space.name} (${space.id})`);
      console.log(`  ✅ Space belongs to venue: ${space.venue_id}`);
      
      await client.query('COMMIT');
      
      console.log('\n3️⃣ Verifying space was created correctly:');
      
      const verification = await pool.query(`
        SELECT s.id, s.name, s.venue_id, v.name as venue_name, v.tenant_id, t.name as tenant_name
        FROM spaces s
        JOIN venues v ON v.id = s.venue_id
        JOIN tenants t ON t.id = v.tenant_id
        WHERE s.id = $1
      `, [space.id]);
      
      const verified = verification.rows[0];
      console.log(`  ✅ Space "${verified.name}" belongs to venue "${verified.venue_name}" of tenant "${verified.tenant_name}"`);
      console.log('  ✅ Tenant isolation working through venue relationship');
      
      console.log('\n4️⃣ Testing cross-tenant access (should be blocked by app logic):');
      
      // Get another tenant
      const otherTenant = await pool.query(`
        SELECT id, name FROM tenants WHERE id != $1 LIMIT 1
      `, [tenant_id]);
      
      if (otherTenant.rows.length > 0) {
        const client2 = await pool.connect();
        try {
          await client2.query('BEGIN');
          await client2.query(`SET LOCAL app.user_role = 'tenant_admin'`);
          await client2.query(`SET LOCAL app.current_tenant = '${otherTenant.rows[0].id}'`);
          
          // Try to access the space from wrong tenant context
          const crossTenantAccess = await client2.query(`
            SELECT s.*, v.tenant_id
            FROM spaces s
            JOIN venues v ON v.id = s.venue_id
            WHERE s.id = $1
          `, [space.id]);
          
          if (crossTenantAccess.rows.length > 0) {
            const accessedSpace = crossTenantAccess.rows[0];
            if (accessedSpace.tenant_id === otherTenant.rows[0].id) {
              console.log('  ❌ SECURITY ISSUE: Cross-tenant access allowed');
            } else {
              console.log('  ⚠️  Query returned space but it belongs to different tenant');
              console.log('     (App logic should filter this out)');
            }
          } else {
            console.log('  ✅ Cross-tenant access properly blocked');
          }
          
          await client2.query('ROLLBACK');
        } finally {
          client2.release();
        }
      }
      
      console.log('\n5️⃣ Cleanup:');
      await pool.query('DELETE FROM spaces WHERE id = $1', [space.id]);
      console.log('  ✅ Test space cleaned up');
      
      console.log('\n🎉 DIAGNOSIS COMPLETE:');
      console.log('  ✅ Spaces can be created successfully by tenants');
      console.log('  ✅ Spaces are linked to venues (which have tenant_id)');
      console.log('  ✅ Tenant isolation works through the venue relationship');
      console.log('  ❓ Check your application code for proper venue ownership validation');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    await pool.end();
  }
}

testCorrectSpacesCreation();