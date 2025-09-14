const { Pool } = require('pg');

async function checkAllTables() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📋 All tables in database:');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const existingTables = tables.rows.map(row => row.table_name);
    console.log('Existing tables:', existingTables);

    const requiredTables = [
      'tenants',
      'users',
      'events',
      'venues',
      'spaces',
      'customers',
      'subscription_packages'
    ];

    console.log('\n✅ Table status:');
    requiredTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`  ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllTables();