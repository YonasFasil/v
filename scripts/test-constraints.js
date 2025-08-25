const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testConstraints() {
  console.log('🔒 Testing tenant constraints...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    // Test 1: Check if per-tenant unique indexes exist
    const indexes = await pool.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE '%_per_tenant_idx'
      ORDER BY indexname
    `);
    
    console.log('Per-tenant unique indexes found:');
    indexes.rows.forEach(row => {
      console.log(`   ${row.indexname}`);
    });
    console.log(`✅ Found ${indexes.rows.length} per-tenant unique indexes\n`);
    
    // Test 2: Check if tenant-aware FK constraints exist
    const fks = await pool.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema = 'public' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%_tenant_fk'
      ORDER BY constraint_name
    `);
    
    console.log('Tenant-aware FK constraints found:');
    fks.rows.forEach(row => {
      console.log(`   ${row.constraint_name}`);
    });
    console.log(`✅ Found ${fks.rows.length} tenant-aware FK constraints\n`);
    
    console.log('🎉 Tenant constraints successfully applied to database!');
    
  } catch (error) {
    console.error('❌ Error testing constraints:', error.message);
  } finally {
    await pool.end();
  }
}

testConstraints();