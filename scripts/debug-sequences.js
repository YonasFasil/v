const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function debugSequences() {
  console.log('🔍 Debugging sequence permissions...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Finding sequences used by tenants table...');
    
    // Check what sequences are used by the tenants table
    const sequences = await pool.query(`
      SELECT 
        c.column_name,
        c.column_default,
        s.sequence_name,
        s.sequence_schema
      FROM information_schema.columns c
      LEFT JOIN information_schema.sequences s ON s.sequence_name = REPLACE(REPLACE(c.column_default, 'nextval(''', ''), '''::regclass)', '')
      WHERE c.table_name = 'tenants' 
        AND c.table_schema = 'public'
        AND c.column_default IS NOT NULL
      ORDER BY c.ordinal_position
    `);
    
    console.log('   Columns with defaults in tenants table:');
    sequences.rows.forEach(row => {
      console.log(`     ${row.column_name}: ${row.column_default}`);
      if (row.sequence_name) {
        console.log(`       Uses sequence: ${row.sequence_name}`);
      }
    });
    
    console.log('\n2️⃣ Finding all sequences in public schema...');
    
    const allSequences = await pool.query(`
      SELECT schemaname, sequencename, sequenceowner 
      FROM pg_sequences 
      WHERE schemaname = 'public'
      ORDER BY sequencename
    `);
    
    console.log('   All sequences:');
    allSequences.rows.forEach(row => {
      console.log(`     ${row.sequencename} (owner: ${row.sequenceowner})`);
    });
    
    console.log('\n3️⃣ Checking sequence permissions for venuine_app...');
    
    // Check if venuine_app has permissions on sequences
    const seqPerms = await pool.query(`
      SELECT 
        n.nspname as schema_name,
        c.relname as sequence_name,
        array_agg(DISTINCT pr.privilege_type) as privileges
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN information_schema.usage_privileges pr 
        ON pr.object_name = c.relname 
        AND pr.object_schema = n.nspname 
        AND pr.grantee = 'venuine_app'
      WHERE c.relkind = 'S' 
        AND n.nspname = 'public'
      GROUP BY n.nspname, c.relname
      ORDER BY c.relname
    `);
    
    console.log('   Sequence permissions for venuine_app:');
    seqPerms.rows.forEach(row => {
      console.log(`     ${row.sequence_name}: ${row.privileges.filter(p => p).join(', ') || 'NO PRIVILEGES'}`);
    });
    
    console.log('\n4️⃣ Testing sequence access directly...');
    
    const client = await pool.connect();
    try {
      await client.query('SET ROLE venuine_app');
      
      // Try to access a sequence directly
      try {
        const nextVal = await client.query("SELECT nextval('tenants_id_seq')");
        console.log(`   ✅ Can access tenants_id_seq, next value would be: ${nextVal.rows[0].nextval}`);
        
        // Reset the sequence value since we incremented it
        await client.query('RESET ROLE');
        await pool.query("SELECT setval('tenants_id_seq', (SELECT setval('tenants_id_seq', currval('tenants_id_seq') - 1)))");
        await client.query('SET ROLE venuine_app');
        
      } catch (seqError) {
        console.log(`   ❌ Cannot access tenants_id_seq: ${seqError.message}`);
      }
      
      await client.query('RESET ROLE');
    } finally {
      client.release();
    }
    
    console.log('\n5️⃣ Granting sequence permissions explicitly...');
    
    try {
      await pool.query('GRANT USAGE, SELECT, UPDATE ON SEQUENCE tenants_id_seq TO venuine_app');
      console.log('   ✅ Granted permissions on tenants_id_seq');
    } catch (grantError) {
      console.log(`   ⚠️  Grant failed: ${grantError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugSequences();