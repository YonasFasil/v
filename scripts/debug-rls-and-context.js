const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugRlsAndContext() {
  console.log('🔍 Debugging RLS and context settings...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking RLS status on tenants table...');
    
    const rlsStatus = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        rowsecurity,
        forcerowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'tenants'
    `);
    
    console.log('   RLS status:');
    rlsStatus.rows.forEach(row => {
      console.log(`     Row security: ${row.rowsecurity}`);
      console.log(`     Force row security: ${row.forcerowsecurity}`);
    });
    
    console.log('\n2️⃣ Checking ALL policies on tenants table...');
    
    const allPolicies = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'tenants'
      ORDER BY policyname
    `);
    
    console.log('   All RLS policies on tenants:');
    if (allPolicies.rows.length > 0) {
      allPolicies.rows.forEach(row => {
        console.log(`     Policy: ${row.policyname}`);
        console.log(`       Command: ${row.cmd}`);
        console.log(`       Roles: ${row.roles}`);
        console.log(`       Permissive: ${row.permissive}`);
        console.log(`       Using: ${row.qual || 'TRUE'}`);
        console.log(`       With Check: ${row.with_check || 'TRUE'}`);
      });
    } else {
      console.log('     No RLS policies found');
    }
    
    console.log('\n3️⃣ Testing context settings...');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET ROLE venuine_app');
      
      // Check current context
      try {
        const userRole = await client.query("SELECT current_setting('app.user_role', true)");
        console.log(`   Current app.user_role: ${userRole.rows[0].current_setting || 'not set'}`);
      } catch (e) {
        console.log('   Current app.user_role: not set (error)');
      }
      
      // Set context
      await client.query(`SET LOCAL app.user_role = 'super_admin'`);
      const newUserRole = await client.query("SELECT current_setting('app.user_role', true)");
      console.log(`   After setting app.user_role: ${newUserRole.rows[0].current_setting}`);
      
      console.log('\n4️⃣ Testing with disabled RLS temporarily...');
      
      // Reset role to postgres to disable RLS
      await client.query('RESET ROLE');
      
      try {
        // Temporarily disable RLS
        await client.query('ALTER TABLE tenants DISABLE ROW LEVEL SECURITY');
        console.log('   ✅ Disabled RLS temporarily');
        
        // Switch back to app role and try INSERT
        await client.query('SET ROLE venuine_app');
        await client.query(`SET LOCAL app.user_role = 'super_admin'`);
        
        const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
        const packageId = packageResult.rows[0]?.id;
        
        const testResult = await client.query(`
          INSERT INTO tenants (name, slug, subscription_package_id, status, created_at, updated_at, current_users, current_venues, monthly_bookings, primary_color)
          VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, $7, $8)
          RETURNING *
        `, ['RLS Test', 'rls-test', packageId, 'active', 0, 0, 0, '#3b82f6']);
        
        console.log('   ✅ INSERT succeeded with RLS disabled!');
        console.log(`   Created: ${testResult.rows[0].name}`);
        
        // Cleanup
        await client.query('DELETE FROM tenants WHERE slug = $1', ['rls-test']);
        
        // Re-enable RLS
        await client.query('RESET ROLE');
        await client.query('ALTER TABLE tenants ENABLE ROW LEVEL SECURITY');
        console.log('   ✅ Re-enabled RLS');
        
      } catch (rlsError) {
        console.log(`   ❌ INSERT failed even with RLS disabled: ${rlsError.message}`);
        
        // Make sure to re-enable RLS
        try {
          await client.query('RESET ROLE');
          await client.query('ALTER TABLE tenants ENABLE ROW LEVEL SECURITY');
        } catch (e) {}
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

debugRlsAndContext();