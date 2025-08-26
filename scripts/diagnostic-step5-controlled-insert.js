const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosticStep5() {
  console.log('🔍 Step 5: Controlled INSERT test...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing controlled INSERT inside transaction with context:');
    
    const client = await pool.connect();
    try {
      console.log('  Starting transaction...');
      await client.query('BEGIN');
      
      console.log('  Setting context: SET LOCAL app.user_role = \'super_admin\'');
      await client.query('SET LOCAL app.user_role = \'super_admin\'');
      
      console.log('  Attempting minimal tenants insert...');
      
      try {
        // Try the most minimal INSERT possible
        const result = await client.query(`
          INSERT INTO public.tenants (name) VALUES ('_diag_test_') RETURNING id
        `);
        
        console.log(`  ✅ SUCCESS! INSERT worked: ${result.rows[0].id}`);
        
        const tenantId = result.rows[0].id;
        
        console.log(`  Setting tenant context: SET LOCAL app.current_tenant = '${tenantId}'`);
        await client.query('SET LOCAL app.current_tenant = $1', [tenantId]);
        
        console.log('  Attempting settings insert...');
        
        try {
          const settingsResult = await client.query(`
            INSERT INTO public.settings (tenant_id, key, value) VALUES ($1, 'diag', '"1"'::jsonb) RETURNING id
          `, [tenantId]);
          
          console.log(`  ✅ Settings INSERT also worked: ${settingsResult.rows[0].id}`);
          
        } catch (settingsError) {
          console.log(`  ❌ Settings INSERT failed: ${settingsError.message}`);
          console.log(`  Error code: ${settingsError.code}`);
          console.log(`  Error detail: ${settingsError.detail || 'none'}`);
          console.log(`  Error hint: ${settingsError.hint || 'none'}`);
        }
        
      } catch (tenantsError) {
        console.log(`  ❌ Tenants INSERT failed: ${tenantsError.message}`);
        console.log(`  Error code: ${tenantsError.code}`);
        console.log(`  Error detail: ${tenantsError.detail || 'none'}`);
        console.log(`  Error hint: ${tenantsError.hint || 'none'}`);
        
        // Let's also try with explicit required fields
        console.log('\n  Trying with all required fields...');
        try {
          const packageResult = await client.query('SELECT id FROM subscription_packages LIMIT 1');
          const packageId = packageResult.rows[0]?.id;
          
          const fullResult = await client.query(`
            INSERT INTO public.tenants (name, slug, subscription_package_id) 
            VALUES ('_diag_full_', '_diag_full_slug_', $1) 
            RETURNING id
          `, [packageId]);
          
          console.log(`  ✅ Full INSERT worked: ${fullResult.rows[0].id}`);
          
        } catch (fullError) {
          console.log(`  ❌ Full INSERT also failed: ${fullError.message}`);
          console.log(`  Error code: ${fullError.code}`);
        }
      }
      
      console.log('  Rolling back transaction...');
      await client.query('ROLLBACK');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Diagnostic step 5 failed:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticStep5();