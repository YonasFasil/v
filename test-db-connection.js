const { Pool } = require('pg');

// Test database connection and basic queries
async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  let pool;
  try {
    // Get database URL (same as the API does)
    const databaseUrl = process.env.DATABASE_URL;
    console.log('Database URL configured:', !!databaseUrl);
    console.log('Database URL prefix:', databaseUrl ? databaseUrl.substring(0, 20) + '...' : 'NOT SET');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Create pool (same config as API)
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    console.log('✅ Pool created successfully');

    // Test 1: Basic connection
    console.log('\n📝 Test 1: Basic connection test...');
    const testResult = await pool.query('SELECT NOW() as current_time, version()');
    console.log('✅ Connection successful');
    console.log('Current time:', testResult.rows[0].current_time);
    console.log('PostgreSQL version:', testResult.rows[0].version.substring(0, 50) + '...');

    // Test 2: Check if tables exist
    console.log('\n📝 Test 2: Checking table structure...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('tenants', 'users', 'subscription_packages')
      ORDER BY table_name
    `);
    console.log('Available tables:', tablesResult.rows.map(r => r.table_name));

    // Test 3: Check tenants table
    console.log('\n📝 Test 3: Checking tenants table...');
    const tenantsCount = await pool.query('SELECT COUNT(*) as count FROM tenants');
    console.log('Total tenants:', tenantsCount.rows[0].count);

    const sampleTenant = await pool.query('SELECT id, name, slug FROM tenants LIMIT 1');
    if (sampleTenant.rows.length > 0) {
      console.log('Sample tenant:', sampleTenant.rows[0]);

      // Test 4: Test the specific query that's failing
      console.log('\n📝 Test 4: Testing tenant users query...');
      const tenantId = sampleTenant.rows[0].id;
      console.log('Testing with tenant ID:', tenantId);

      const usersResult = await pool.query(`
        SELECT id, username, name, email, role, permissions,
               is_active, last_login, created_at
        FROM users
        WHERE tenant_id = $1
        ORDER BY created_at DESC
      `, [tenantId]);

      console.log('✅ Users query successful');
      console.log('Users found:', usersResult.rows.length);
      if (usersResult.rows.length > 0) {
        console.log('Sample user:', {
          id: usersResult.rows[0].id,
          name: usersResult.rows[0].name,
          email: usersResult.rows[0].email,
          role: usersResult.rows[0].role
        });
      }
    } else {
      console.log('❌ No tenants found in database');
    }

    // Test 5: Check users table structure
    console.log('\n📝 Test 5: Checking users table structure...');
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔚 Database connection closed');
    }
  }
}

// Run the test
testDatabaseConnection();