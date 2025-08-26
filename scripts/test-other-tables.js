const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testOtherTables() {
  console.log('🔍 Testing if INSERT works on other tables...\n');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
  });

  try {
    console.log('1️⃣ Testing INSERT on a different table (users)...');
    
    // First, let's see what tables exist and try a simple one
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'tenants'
      ORDER BY table_name
      LIMIT 5
    `);
    
    console.log('   Available tables to test:');
    tables.rows.forEach(row => console.log(`     - ${row.table_name}`));
    
    // Let's try settings table as it's likely simple
    console.log('\n2️⃣ Testing INSERT on settings table...');
    
    try {
      // First check the structure of settings
      const settingsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'settings' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('   Settings table structure:');
      settingsStructure.rows.forEach(col => {
        console.log(`     ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `(default: ${col.column_default})` : ''}`);
      });
      
      // Try a simple INSERT
      const settingsResult = await pool.query(`
        INSERT INTO settings (tenant_id, key, value, created_at, updated_at) 
        VALUES (gen_random_uuid(), 'test_key', 'test_value', NOW(), NOW())
        RETURNING id, key
      `);
      
      console.log(`   ✅ Settings INSERT worked: ${settingsResult.rows[0].key} (${settingsResult.rows[0].id})`);
      
      // Clean up
      await pool.query('DELETE FROM settings WHERE id = $1', [settingsResult.rows[0].id]);
      console.log('   ✅ Settings cleanup successful');
      
    } catch (settingsError) {
      console.log(`   ❌ Settings INSERT failed: ${settingsError.message}`);
      console.log(`   Error code: ${settingsError.code}`);
    }
    
    console.log('\n3️⃣ Testing CREATE TABLE and INSERT...');
    
    try {
      // Create a test table
      await pool.query(`
        CREATE TEMPORARY TABLE test_insert_permissions (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      console.log('   ✅ Test table created successfully');
      
      // Try INSERT on our test table
      const testResult = await pool.query(`
        INSERT INTO test_insert_permissions (name) 
        VALUES ('test entry')
        RETURNING id, name
      `);
      
      console.log(`   ✅ Test table INSERT worked: ${testResult.rows[0].name} (${testResult.rows[0].id})`);
      
      // This table will be automatically dropped when connection closes
      
    } catch (testTableError) {
      console.log(`   ❌ Test table failed: ${testTableError.message}`);
      console.log(`   Error code: ${testTableError.code}`);
    }
    
    console.log('\n4️⃣ Final diagnosis...');
    
    if (testTableError && testTableError.message.includes('permission denied')) {
      console.log('   🎯 CONFIRMED: The issue affects ALL INSERT operations');
      console.log('   This points to a fundamental PostgreSQL configuration issue');
      console.log('   Possible causes:');
      console.log('   - Database is in read-only mode');
      console.log('   - Some extension or configuration is blocking writes');
      console.log('   - Connection pooling/proxy issues');
      console.log('   - Database corruption');
    } else {
      console.log('   🤔 INSERT works on other tables but not tenants');
      console.log('   This suggests a tenants-specific issue like:');
      console.log('   - Table corruption');
      console.log('   - Hidden triggers or constraints');
      console.log('   - Table-level permissions issue');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testOtherTables();