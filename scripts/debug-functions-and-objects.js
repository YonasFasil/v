const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugFunctionsAndObjects() {
  console.log('🔍 Debugging functions and other schema objects...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking functions in public schema...');
    
    const functions = await pool.query(`
      SELECT 
        p.proname as function_name,
        pg_catalog.pg_get_function_arguments(p.oid) as arguments,
        t.typname as return_type
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      LEFT JOIN pg_type t ON t.oid = p.prorettype
      WHERE n.nspname = 'public'
      ORDER BY p.proname
    `);
    
    console.log('   Functions in public schema:');
    if (functions.rows.length > 0) {
      functions.rows.forEach(row => {
        console.log(`     ${row.function_name}(${row.arguments}) -> ${row.return_type}`);
      });
    } else {
      console.log('     No custom functions found');
    }
    
    console.log('\n2️⃣ Checking function permissions for venuine_app...');
    
    const funcPerms = await pool.query(`
      SELECT 
        p.proname as function_name,
        has_function_privilege('venuine_app', p.oid, 'EXECUTE') as can_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
      ORDER BY p.proname
    `);
    
    console.log('   Function execute permissions for venuine_app:');
    if (funcPerms.rows.length > 0) {
      funcPerms.rows.forEach(row => {
        console.log(`     ${row.function_name}: ${row.can_execute ? 'CAN EXECUTE' : 'NO EXECUTE'}`);
      });
    } else {
      console.log('     No custom functions to check');
    }
    
    console.log('\n3️⃣ Checking gen_random_uuid() specifically...');
    
    const client = await pool.connect();
    try {
      await client.query('SET ROLE venuine_app');
      
      try {
        const uuid = await client.query('SELECT gen_random_uuid()');
        console.log(`   ✅ Can call gen_random_uuid(): ${uuid.rows[0].gen_random_uuid}`);
      } catch (uuidError) {
        console.log(`   ❌ Cannot call gen_random_uuid(): ${uuidError.message}`);
      }
      
      try {
        const now = await client.query('SELECT NOW()');
        console.log(`   ✅ Can call NOW(): ${now.rows[0].now}`);
      } catch (nowError) {
        console.log(`   ❌ Cannot call NOW(): ${nowError.message}`);
      }
      
      await client.query('RESET ROLE');
    } finally {
      client.release();
    }
    
    console.log('\n4️⃣ Testing INSERT with explicit values (avoiding functions)...');
    
    const client2 = await pool.connect();
    try {
      await client2.query('BEGIN');
      await client2.query('SET ROLE venuine_app');
      await client2.query(`SET LOCAL app.user_role = 'super_admin'`);
      
      // Get package ID
      const packageResult = await client2.query('SELECT id FROM subscription_packages LIMIT 1');
      const packageId = packageResult.rows[0]?.id;
      
      // Manual UUID and timestamp
      const manualUuid = '12345678-1234-1234-1234-123456789012';
      const manualTimestamp = new Date().toISOString();
      
      try {
        const result = await client2.query(`
          INSERT INTO tenants (id, name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [manualUuid, 'Manual Test', 'manual-test', packageId, 'active', manualTimestamp, manualTimestamp, 0, 0, 0, '#3b82f6']);
        
        console.log('   ✅ INSERT with explicit values succeeded!');
        console.log(`   Created: ${result.rows[0].name} (${result.rows[0].id})`);
        
        // Cleanup
        await client2.query('DELETE FROM tenants WHERE id = $1', [manualUuid]);
        console.log('   ✅ Cleanup successful');
        
      } catch (insertError) {
        console.log(`   ❌ INSERT with explicit values failed: ${insertError.message}`);
        console.log(`   Error code: ${insertError.code}`);
      }
      
      await client2.query('COMMIT');
    } catch (error) {
      await client2.query('ROLLBACK');
      throw error;
    } finally {
      await client2.query('RESET ROLE');
      client2.release();
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugFunctionsAndObjects();