const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugInsertPermissions() {
  console.log('🔍 Debugging INSERT permissions specifically...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking table-level permissions as postgres...');
    
    // Check table permissions
    const tablePerms = await pool.query(`
      SELECT grantee, table_name, privilege_type, is_grantable
      FROM information_schema.table_privileges 
      WHERE table_name = 'tenants' AND grantee = 'venuine_app'
      ORDER BY privilege_type
    `);
    
    console.log('   Table-level permissions for venuine_app on tenants:');
    tablePerms.rows.forEach(row => {
      console.log(`     ${row.privilege_type} (grantable: ${row.is_grantable})`);
    });
    
    console.log('\n2️⃣ Checking column-level permissions...');
    
    const columnPerms = await pool.query(`
      SELECT grantee, table_name, column_name, privilege_type
      FROM information_schema.column_privileges 
      WHERE table_name = 'tenants' AND grantee = 'venuine_app'
    `);
    
    console.log('   Column-level permissions:');
    if (columnPerms.rows.length > 0) {
      columnPerms.rows.forEach(row => {
        console.log(`     ${row.column_name}: ${row.privilege_type}`);
      });
    } else {
      console.log('     No column-level permissions (this is normal - table-level should be sufficient)');
    }
    
    console.log('\n3️⃣ Checking RLS policies on tenants table...');
    
    const policies = await pool.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tenants'
    `);
    
    console.log('   RLS policies on tenants table:');
    policies.rows.forEach(row => {
      console.log(`     Policy: ${row.policyname}`);
      console.log(`       Command: ${row.cmd}`);
      console.log(`       Roles: ${row.roles}`);
      console.log(`       Using: ${row.qual || 'none'}`);
      console.log(`       With Check: ${row.with_check || 'none'}`);
    });
    
    console.log('\n4️⃣ Testing INSERT as venuine_app with detailed error...');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET ROLE venuine_app');
      await client.query(`SET LOCAL app.user_role = 'super_admin'`);
      
      // Get package ID
      const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
      const packageId = packageResult.rows[0]?.id;
      
      try {
        // Try the INSERT and capture exact error
        const result = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *
        `, ['Debug Test', 'debug-test', packageId, 'active']);
        
        console.log('   ✅ INSERT succeeded unexpectedly!');
        console.log(`   Created: ${result.rows[0].name}`);
        
        // Clean up
        await client.query('DELETE FROM tenants WHERE slug = $1', ['debug-test']);
        
      } catch (insertError) {
        console.log('   ❌ INSERT failed with detailed error:');
        console.log(`     Error code: ${insertError.code}`);
        console.log(`     Error message: ${insertError.message}`);
        console.log(`     Error detail: ${insertError.detail}`);
        console.log(`     Error hint: ${insertError.hint}`);
      }
      
      await client.query('ROLLBACK');
      
    } finally {
      await client.query('RESET ROLE');
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugInsertPermissions();