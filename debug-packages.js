const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugPackages() {
  try {
    // Check if packages table really exists and what its structure is
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = packages
      ORDER BY ordinal_position
    `);
    
    console.log("Packages table columns:", tableInfo.rows);

    // Try a simple select on the packages table
    const simpleQuery = await pool.query("SELECT 1 FROM packages LIMIT 1");
    console.log("Simple packages query worked");

  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

debugPackages();
