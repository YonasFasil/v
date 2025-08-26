const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugRlsSimple() {
  console.log('🔍 Debugging RLS (simplified)...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking RLS status on tenants table...');
    
    const rlsStatus = await pool.query(`
      SELECT 
        c.relname as table_name,
        c.relrowsecurity as row_security_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'tenants'
    `);
    
    console.log('   RLS status:');
    rlsStatus.rows.forEach(row => {
      console.log(`     Table: ${row.table_name}`);
      console.log(`     Row security enabled: ${row.row_security_enabled}`);
    });
    
    console.log('\n2️⃣ If RLS is disabled, try the INSERT...');
    
    if (!rlsStatus.rows[0]?.row_security_enabled) {
      console.log('   RLS is disabled, trying INSERT...');
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET ROLE venuine_app');
        await client.query(`SET LOCAL app.user_role = 'super_admin'`);
        
        const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
        const packageId = packageResult.rows[0]?.id;
        
        const testResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING *
        `, ['No RLS Test', 'no-rls-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log('   ✅ INSERT succeeded!');
        console.log(`   Created: ${testResult.rows[0].name}`);
        
        // Cleanup
        await client.query('DELETE FROM tenants WHERE slug = $1', ['no-rls-test']);
        await client.query('COMMIT');
        
      } catch (insertError) {
        await client.query('ROLLBACK');
        console.log(`   ❌ INSERT still failed: ${insertError.message}`);
      } finally {
        await client.query('RESET ROLE');
        client.release();
      }
    } else {
      console.log('   RLS is enabled, that could be the issue');
    }
    
    console.log('\n3️⃣ Testing a different approach: BYPASS RLS temporarily...');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Stay as postgres (superuser) but grant venuine_app BYPASSRLS temporarily
      
      console.log('   Granting BYPASSRLS to venuine_app temporarily...');
      await client.query('ALTER ROLE venuine_app BYPASSRLS');
      
      // Now switch to venuine_app
      await client.query('SET ROLE venuine_app');
      await client.query(`SET LOCAL app.user_role = 'super_admin'`);
      
      const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
      const packageId = packageResult.rows[0]?.id;
      
      try {
        const testResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING *
        `, ['Bypass Test', 'bypass-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log('   ✅ INSERT succeeded with BYPASSRLS!');
        console.log(`   Created: ${testResult.rows[0].name}`);
        
        // Cleanup
        await client.query('DELETE FROM tenants WHERE slug = $1', ['bypass-test']);
        
      } catch (bypassError) {
        console.log(`   ❌ INSERT failed even with BYPASSRLS: ${bypassError.message}`);
      }
      
      // Remove BYPASSRLS
      await client.query('RESET ROLE');
      await client.query('ALTER ROLE venuine_app NOBYPASSRLS');
      console.log('   ✅ Removed BYPASSRLS from venuine_app');
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugRlsSimple();