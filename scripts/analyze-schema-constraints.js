const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function analyzeSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('📋 Analyzing current schema for tenant-aware constraints...\n');
    
    // Check existing unique constraints
    const uniqueConstraints = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        string_agg(ccu.column_name, ', ') as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'UNIQUE'
        AND tc.table_name IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id')
      GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
      ORDER BY tc.table_name
    `);
    
    console.log('Current UNIQUE constraints on tenant tables:');
    uniqueConstraints.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.columns} (${row.constraint_name})`);
    });
    
    // Check existing foreign key constraints
    const foreignKeys = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        ccu.table_name as referenced_table,
        string_agg(kcu.column_name, ', ') as columns,
        string_agg(ccu.column_name, ', ') as referenced_columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id')
      GROUP BY tc.table_name, tc.constraint_name, ccu.table_name
      ORDER BY tc.table_name
    `);
    
    console.log('\nCurrent FOREIGN KEY constraints on tenant tables:');
    foreignKeys.rows.forEach(row => {
      console.log(`   ${row.table_name}(${row.columns}) -> ${row.referenced_table}(${row.referenced_columns}) (${row.constraint_name})`);
    });
    
    // Look for fields that should have per-tenant uniqueness
    const potentialUniqueFields = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name IN (SELECT table_name FROM information_schema.columns WHERE column_name = 'tenant_id')
        AND column_name IN ('email', 'name', 'subdomain', 'phone', 'code', 'slug')
      ORDER BY table_name, column_name
    `);
    
    console.log('\nFields that might need per-tenant uniqueness:');
    potentialUniqueFields.rows.forEach(row => {
      console.log(`   ${row.table_name}.${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

analyzeSchema();