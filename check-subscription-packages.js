const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSubscriptionPackages() {
  try {
    // Check subscription_packages table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = subscription_packages
      ORDER BY ordinal_position
    `);

    console.log("subscription_packages table structure:");
    console.log(tableInfo.rows);

    // Check if data exists
    const data = await pool.query("SELECT * FROM subscription_packages LIMIT 3");
    console.log("\nCurrent subscription packages:");
    console.log(JSON.stringify(data.rows, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSubscriptionPackages();
