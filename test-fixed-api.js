const { Pool } = require('pg');

async function testFixedAPI() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test the fixed query
    console.log('🧪 Testing the fixed tenant users query...');

    const tenantId = 'e9339ad3-5752-4c2d-ae50-f2a1f84fd200'; // The one from your test

    const result = await pool.query(`
      SELECT id, username, name, email, role, permissions,
             is_active, last_login_at as last_login, created_at
      FROM users
      WHERE tenant_id = $1
      ORDER BY created_at DESC
    `, [tenantId]);

    console.log('✅ Query executed successfully!');
    console.log('Users found:', result.rows.length);

    if (result.rows.length > 0) {
      console.log('\n👥 User data:');
      result.rows.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        console.log(`     Active: ${user.is_active}, Last login: ${user.last_login || 'Never'}`);
      });
    } else {
      console.log('No users found for tenant ID:', tenantId);

      // Check if tenant exists
      const tenantCheck = await pool.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
      if (tenantCheck.rows.length > 0) {
        console.log('Tenant exists:', tenantCheck.rows[0].name);
      } else {
        console.log('❌ Tenant not found!');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testFixedAPI();