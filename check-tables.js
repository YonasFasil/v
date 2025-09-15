const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    // Check what tables exist - simpler query
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");

    console.log("Available tables:");
    console.log(tables.rows.map(row => row.tablename));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
