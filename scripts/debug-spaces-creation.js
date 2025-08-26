const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugSpacesCreation() {
  console.log('🔍 Debugging spaces creation for tenant users...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking spaces table structure:');
    
    const spacesStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'spaces' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('Spaces table columns:');
    spacesStructure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `(default: ${col.column_default})` : ''}`);
    });
    
    console.log('\n2️⃣ Checking foreign key constraints on spaces:');
    
    const spacesFK = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = 'public.spaces'::regclass AND contype = 'f'
    `);
    
    console.log('Foreign key constraints:');
    spacesFK.rows.forEach(fk => {
      console.log(`  ${fk.conname}: ${fk.def}`);
    });
    
    console.log('\n3️⃣ Checking RLS policies on spaces:');
    
    const spacesRLS = await pool.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'spaces' AND schemaname = 'public'
    `);
    
    console.log('RLS policies on spaces:');
    if (spacesRLS.rows.length > 0) {
      spacesRLS.rows.forEach(policy => {
        console.log(`  Policy: ${policy.policyname} (${policy.cmd})`);
        console.log(`    Roles: ${policy.roles}`);
        console.log(`    Using: ${policy.qual || 'TRUE'}`);
        console.log(`    With Check: ${policy.with_check || 'TRUE'}`);
      });
    } else {
      console.log('  No RLS policies found on spaces table');
    }
    
    console.log('\n4️⃣ Checking if RLS is enabled on spaces:');
    
    const rlsEnabled = await pool.query(`
      SELECT c.relname as table_name, c.relrowsecurity as row_security_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'spaces'
    `);
    
    console.log('RLS status:');
    rlsEnabled.rows.forEach(row => {
      console.log(`  ${row.table_name}: RLS ${row.row_security_enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    console.log('\n5️⃣ Testing space creation as tenant user:');
    
    // First get a tenant and venue to test with
    const testData = await pool.query(`
      SELECT t.id as tenant_id, t.name as tenant_name, v.id as venue_id, v.name as venue_name
      FROM tenants t
      LEFT JOIN venues v ON v.tenant_id = t.id
      ORDER BY t.created_at DESC
      LIMIT 1
    `);
    
    if (testData.rows.length === 0) {
      console.log('  ❌ No tenants found for testing');
      return;
    }
    
    const { tenant_id, tenant_name, venue_id, venue_name } = testData.rows[0];
    
    if (!venue_id) {
      console.log(`  ⚠️  Tenant "${tenant_name}" has no venues. Creating a test venue first...`);
      
      // Create a test venue first
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL app.user_role = 'tenant_admin'`);
        await client.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
        
        const venueResult = await client.query(`
          INSERT INTO venues (tenant_id, name, description, capacity, price_per_hour, amenities, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING id, name
        `, [tenant_id, 'Test Venue for Spaces', 'Test venue description', 100, 50.00, '[]', true]);
        
        await client.query('COMMIT');
        console.log(`  ✅ Created test venue: ${venueResult.rows[0].name} (${venueResult.rows[0].id})`);
        
        // Update our test data
        testData.rows[0].venue_id = venueResult.rows[0].id;
        testData.rows[0].venue_name = venueResult.rows[0].name;
        
      } catch (venueError) {
        await client.query('ROLLBACK');
        console.log(`  ❌ Failed to create test venue: ${venueError.message}`);
        return;
      } finally {
        client.release();
      }
    }
    
    console.log(`  Using tenant: ${tenant_name} (${tenant_id})`);
    console.log(`  Using venue: ${venue_name} (${venue_id})`);
    
    console.log('\n6️⃣ Attempting to create a space as tenant user:');
    
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      await client2.query(`SET LOCAL app.user_role = 'tenant_admin'`);
      await client2.query(`SET LOCAL app.current_tenant = '${tenant_id}'`);
      
      const spaceResult = await client2.query(`
        INSERT INTO spaces (tenant_id, venue_id, name, description, capacity, price_per_hour, amenities, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, name
      `, [tenant_id, venue_id, 'Test Space', 'Test space description', 50, 25.00, '[]', true]);
      
      console.log(`  ✅ Space creation SUCCESS: ${spaceResult.rows[0].name} (${spaceResult.rows[0].id})`);
      
      await client2.query('COMMIT');
      
      // Cleanup test data
      await pool.query('DELETE FROM spaces WHERE id = $1', [spaceResult.rows[0].id]);
      console.log('  ✅ Test cleanup complete');
      
    } catch (spaceError) {
      await client2.query('ROLLBACK');
      console.log(`  ❌ Space creation FAILED: ${spaceError.message}`);
      console.log(`  Error code: ${spaceError.code}`);
      console.log(`  Error detail: ${spaceError.detail || 'none'}`);
      
      if (spaceError.message.includes('permission denied')) {
        console.log('  🎯 PERMISSION ISSUE: Check RLS policies or table permissions');
      } else if (spaceError.message.includes('violates')) {
        console.log('  🎯 CONSTRAINT ISSUE: Check required fields or foreign key constraints');
      }
      
    } finally {
      client2.release();
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugSpacesCreation();