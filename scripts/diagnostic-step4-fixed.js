const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function diagnosticStep4Fixed() {
  console.log('🔍 Step 4: FK constraints (fixed)...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Sequences (we know there are none - tables use gen_random_uuid())');
    console.log('  No sequences found (confirmed from step 3 - uses gen_random_uuid() and now())');
    
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

diagnosticStep4Fixed();