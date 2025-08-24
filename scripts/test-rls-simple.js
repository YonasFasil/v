const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function testRlsSimple() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('🛡️  Testing simple RLS operations...\n');
    
    // Test 1: Enable RLS on one table
    console.log('📋 Test 1: Enable RLS on bookings table');
    await pool.query('ALTER TABLE bookings ENABLE ROW LEVEL SECURITY');
    console.log('✅ RLS enabled on bookings');
    
    // Test 2: Force RLS on one table  
    console.log('📋 Test 2: Force RLS on bookings table');
    await pool.query('ALTER TABLE bookings FORCE ROW LEVEL SECURITY');
    console.log('✅ RLS forced on bookings');
    
    // Test 3: Check the flags
    console.log('📋 Test 3: Check RLS flags');
    const result = await pool.query(`
      SELECT 
        relname,
        relrowsecurity as rls_enabled,
        relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND relname = 'bookings'
    `);
    
    console.log('Bookings RLS status:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testRlsSimple();