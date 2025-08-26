const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosticStep2() {
  console.log('🔍 Step 2: INSERT-time triggers and their functions...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ List all non-internal triggers on tenants and settings:');
    
    const triggerInfo = await pool.query(`
      SELECT 'tenants' AS table, t.tgname, pg_get_triggerdef(t.oid) AS trigger_def,
             p.proname AS func_name, ns.nspname AS func_schema, p.prosecdef AS security_definer,
             pg_get_userbyid(p.proowner) AS func_owner
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid=t.tgfoid
      JOIN pg_namespace ns ON ns.oid=p.pronamespace
      WHERE t.tgrelid = 'public.tenants'::regclass AND NOT t.tgisinternal
      UNION ALL
      SELECT 'settings', t.tgname, pg_get_triggerdef(t.oid), p.proname, ns.nspname, p.prosecdef,
             pg_get_userbyid(p.proowner)
      FROM pg_trigger t
      JOIN pg_proc p ON p.oid=t.tgfoid
      JOIN pg_namespace ns ON ns.oid=p.pronamespace
      WHERE t.tgrelid = 'public.settings'::regclass AND NOT t.tgisinternal
    `);
    
    console.log('Trigger results:');
    if (triggerInfo.rows.length > 0) {
      triggerInfo.rows.forEach(row => {
        console.log(`  Table: ${row.table}`);
        console.log(`  Trigger: ${row.tgname}`);
        console.log(`  Function: ${row.func_schema}.${row.func_name}`);
        console.log(`  Security Definer: ${row.security_definer}`);
        console.log(`  Function Owner: ${row.func_owner}`);
        console.log(`  Definition: ${row.trigger_def}`);
        console.log('  ---');
      });
      
      // Get unique function names to examine
      const uniqueFunctions = [...new Set(triggerInfo.rows.map(row => row.func_name))];
      
      console.log('\n2️⃣ Function definitions for each trigger function:');
      
      for (const funcName of uniqueFunctions) {
        console.log(`\nFunction: ${funcName}`);
        
        const funcDef = await pool.query(`
          SELECT n.nspname, p.proname, p.prosecdef AS security_definer,
                 pg_get_userbyid(p.proowner) AS func_owner,
                 pg_get_functiondef(p.oid) AS def
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE p.proname = $1
        `, [funcName]);
        
        funcDef.rows.forEach(func => {
          console.log(`  Schema: ${func.nspname}`);
          console.log(`  Security Definer: ${func.security_definer}`);
          console.log(`  Owner: ${func.func_owner}`);
          console.log(`  Definition:`);
          console.log(`${func.def}`);
          console.log('  ---');
        });
      }
      
    } else {
      console.log('  No triggers found on tenants or settings tables');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic step 2 failed:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticStep2();