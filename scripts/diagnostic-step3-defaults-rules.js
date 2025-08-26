const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosticStep3() {
  console.log('🔍 Step 3: Defaults, generated columns, and rules...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Column defaults:');
    
    const columnDefaults = await pool.query(`
      SELECT 'tenants' AS table, a.attname, pg_get_expr(d.adbin, d.adrelid) AS default_expr
      FROM pg_attribute a
      JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE a.attrelid='public.tenants'::regclass AND d.adbin IS NOT NULL
      UNION ALL
      SELECT 'settings', a.attname, pg_get_expr(d.adbin, d.adrelid)
      FROM pg_attribute a
      JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
      WHERE a.attrelid='public.settings'::regclass AND d.adbin IS NOT NULL
    `);
    
    console.log('Default expressions:');
    if (columnDefaults.rows.length > 0) {
      columnDefaults.rows.forEach(row => {
        console.log(`  ${row.table}.${row.attname}: ${row.default_expr}`);
      });
    } else {
      console.log('  No column defaults found');
    }
    
    console.log('\n2️⃣ Generated columns:');
    
    const generatedCols = await pool.query(`
      SELECT 'tenants' AS table, attname, attgenerated
      FROM pg_attribute WHERE attrelid='public.tenants'::regclass AND attgenerated <> ''
      UNION ALL
      SELECT 'settings', attname, attgenerated
      FROM pg_attribute WHERE attrelid='public.settings'::regclass AND attgenerated <> ''
    `);
    
    console.log('Generated columns:');
    if (generatedCols.rows.length > 0) {
      generatedCols.rows.forEach(row => {
        console.log(`  ${row.table}.${row.attname}: ${row.attgenerated}`);
      });
    } else {
      console.log('  No generated columns found');
    }
    
    console.log('\n3️⃣ Rewrite rules:');
    
    const rules = await pool.query(`
      SELECT * FROM pg_rules
      WHERE schemaname='public' AND tablename IN ('tenants','settings')
    `);
    
    console.log('Rewrite rules:');
    if (rules.rows.length > 0) {
      rules.rows.forEach(row => {
        console.log(`  Rule: ${row.rulename} on ${row.schemaname}.${row.tablename}`);
        console.log(`  Event: ${row.ev_type}`);
        console.log(`  Definition: ${row.definition}`);
        console.log('  ---');
      });
    } else {
      console.log('  No rewrite rules found');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic step 3 failed:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticStep3();