const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosticStep4() {
  console.log('🔍 Step 4: Sequences & FK constraints touched on insert...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Sequences referenced by defaults:');
    
    const sequences = await pool.query(`
      SELECT refobjid::regclass AS table_name, seqrelid::regclass AS sequence_name
      FROM pg_depend d JOIN pg_class c ON c.oid=seqrelid
      WHERE refobjid IN ('public.tenants'::regclass,'public.settings'::regclass)
        AND c.relkind='S'
    `);
    
    console.log('Sequences:');
    if (sequences.rows.length > 0) {
      sequences.rows.forEach(row => {
        console.log(`  ${row.table_name} uses sequence: ${row.sequence_name}`);
      });
    } else {
      console.log('  No sequences found (tables likely use gen_random_uuid() for IDs)');
    }
    
    console.log('\n2️⃣ Foreign keys:');
    
    const foreignKeys = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid IN ('public.tenants'::regclass,'public.settings'::regclass)
        AND contype='f'
    `);
    
    console.log('Foreign key constraints:');
    if (foreignKeys.rows.length > 0) {
      foreignKeys.rows.forEach(row => {
        console.log(`  ${row.conname}: ${row.def}`);
      });
      
      // Test access to foreign key referenced tables
      console.log('\n3️⃣ Testing access to FK referenced tables:');
      
      for (const fk of foreignKeys.rows) {
        // Extract referenced table from constraint definition
        const match = fk.def.match(/REFERENCES\s+(\w+(?:\.\w+)?)/i);
        if (match) {
          const referencedTable = match[1];
          try {
            const testAccess = await pool.query(`SELECT COUNT(*) FROM ${referencedTable}`);
            console.log(`  ✅ Can access ${referencedTable}: ${testAccess.rows[0].count} rows`);
          } catch (accessError) {
            console.log(`  ❌ Cannot access ${referencedTable}: ${accessError.message}`);
            if (accessError.message.includes('permission denied')) {
              console.log('    🎯 POTENTIAL ISSUE: FK reference table has permission problems!');
            }
          }
        }
      }
      
    } else {
      console.log('  No foreign key constraints found');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic step 4 failed:', error.message);
  } finally {
    await pool.end();
  }
}

diagnosticStep4();