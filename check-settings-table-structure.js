const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSettingsTable() {
  try {
    // Check the exact table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = settings
      ORDER BY ordinal_position
    `);

    console.log("Settings table structure:");
    console.log(tableInfo.rows);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSettingsTable();
