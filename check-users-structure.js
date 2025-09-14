const { Pool } = require('pg');

async function checkUsersTable() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check users table structure
    console.log('📋 Users table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Get sample user data
    console.log('\n👤 Sample user data:');
    const sampleUser = await pool.query('SELECT * FROM users LIMIT 1');
    if (sampleUser.rows.length > 0) {
      console.log('Available columns in data:', Object.keys(sampleUser.rows[0]));
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();