const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function deepTriggerInvestigation() {
  console.log('🔍 Deep investigation of triggers, functions, and table structure...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Checking ALL triggers in the database...');
    
    const allTriggers = await pool.query(`
      SELECT 
        t.trigger_name,
        t.event_object_table as table_name,
        t.event_manipulation,
        t.action_timing,
        t.action_statement,
        p.proname as function_name,
        p.prosrc as function_source
      FROM information_schema.triggers t
      LEFT JOIN pg_proc p ON p.proname = REPLACE(REPLACE(t.action_statement, 'EXECUTE FUNCTION ', ''), '()', '')
      LEFT JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
      WHERE t.trigger_schema = 'public'
      ORDER BY t.event_object_table, t.trigger_name
    `);
    
    console.log('   All triggers in database:');
    if (allTriggers.rows.length > 0) {
      allTriggers.rows.forEach(trigger => {
        console.log(`     ${trigger.table_name}.${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`       Function: ${trigger.action_statement}`);
        if (trigger.function_source && trigger.function_source.includes('permission denied')) {
          console.log(`       🎯 FOUND SUSPICIOUS: Function contains "permission denied"!`);
          console.log(`       Source: ${trigger.function_source}`);
        }
      });
    } else {
      console.log('     No triggers found in database');
    }
    
    console.log('\n2️⃣ Checking ALL functions for "permission denied" text...');
    
    const suspiciousFunctions = await pool.query(`
      SELECT 
        p.proname as function_name,
        n.nspname as schema_name,
        pg_catalog.pg_get_function_arguments(p.oid) as arguments,
        p.prosrc as source_code
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE p.prosrc ILIKE '%permission denied%'
         OR p.prosrc ILIKE '%schema public%'
      ORDER BY n.nspname, p.proname
    `);
    
    console.log('   Functions containing "permission denied" or "schema public":');
    if (suspiciousFunctions.rows.length > 0) {
      suspiciousFunctions.rows.forEach(func => {
        console.log(`     🎯 ${func.schema_name}.${func.function_name}(${func.arguments})`);
        console.log(`       Source: ${func.source_code}`);
        console.log('       ---');
      });
    } else {
      console.log('     No suspicious functions found');
    }
    
    console.log('\n3️⃣ Checking if tenants is actually a view...');
    
    const tableType = await pool.query(`
      SELECT 
        table_name,
        table_type,
        table_schema
      FROM information_schema.tables 
      WHERE table_name = 'tenants' AND table_schema = 'public'
    `);
    
    if (tableType.rows.length > 0) {
      const type = tableType.rows[0];
      console.log(`   tenants is a: ${type.table_type}`);
      
      if (type.table_type !== 'BASE TABLE') {
        console.log('   🎯 FOUND ISSUE: tenants is not a base table!');
      }
    }
    
    console.log('\n4️⃣ Checking column defaults and their functions...');
    
    const columnDefaults = await pool.query(`
      SELECT 
        column_name,
        column_default,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenants' 
        AND table_schema = 'public'
        AND column_default IS NOT NULL
      ORDER BY ordinal_position
    `);
    
    console.log('   Columns with defaults:');
    columnDefaults.rows.forEach(col => {
      console.log(`     ${col.column_name}: ${col.column_default}`);
      
      // Check if default calls any custom functions
      if (col.column_default.includes('(') && !col.column_default.includes('gen_random_uuid') && !col.column_default.includes('now')) {
        console.log(`       🎯 SUSPICIOUS: Custom function in default`);
      }
    });
    
    console.log('\n5️⃣ Checking foreign key constraints and referenced tables...');
    
    const foreignKeys = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'tenants'
        AND tc.table_schema = 'public'
    `);
    
    console.log('   Foreign key constraints on tenants:');
    if (foreignKeys.rows.length > 0) {
      foreignKeys.rows.forEach(fk => {
        console.log(`     ${fk.constraint_name}: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`       Delete: ${fk.delete_rule}, Update: ${fk.update_rule}`);
      });
      
      // Test if we can access the referenced tables
      console.log('\n   Testing access to referenced tables...');
      for (const fk of foreignKeys.rows) {
        try {
          const testAccess = await pool.query(`SELECT COUNT(*) FROM ${fk.foreign_table_name}`);
          console.log(`     ✅ Can access ${fk.foreign_table_name}: ${testAccess.rows[0].count} rows`);
        } catch (accessError) {
          console.log(`     ❌ Cannot access ${fk.foreign_table_name}: ${accessError.message}`);
        }
      }
    } else {
      console.log('     No foreign key constraints found');
    }
    
    console.log('\n6️⃣ Testing INSERT with each column individually...');
    
    // Test minimal INSERT
    try {
      const testResult = await pool.query(`
        INSERT INTO tenants (name) 
        VALUES ('Minimal Test')
        RETURNING id, name
      `);
      console.log(`     ✅ Minimal INSERT (name only) succeeded: ${testResult.rows[0].name}`);
      
      await pool.query('DELETE FROM tenants WHERE id = $1', [testResult.rows[0].id]);
      
    } catch (minimalError) {
      console.log(`     ❌ Even minimal INSERT failed: ${minimalError.message}`);
      console.log(`     Error code: ${minimalError.code}`);
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await pool.end();
  }
}

deepTriggerInvestigation();