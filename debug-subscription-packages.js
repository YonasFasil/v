const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAndFixSubscriptionPackages() {
  try {
    // First try to select from the table to see what exists
    try {
      const result = await pool.query("SELECT * FROM subscription_packages LIMIT 1");
      console.log("Table exists. Current structure:");
      if (result.rows.length > 0) {
        console.log("Columns:", Object.keys(result.rows[0]));
      }
    } catch (e) {
      console.log("Table access error:", e.message);
    }

    // Try to add the features column as a simple TEXT column
    try {
      await pool.query("ALTER TABLE subscription_packages ADD COLUMN features TEXT DEFAULT {}");
      console.log("Added features column");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("Features column already exists");
      } else {
        console.log("Features column error:", e.message);
      }
    }

    // Try to insert a simple test package
    try {
      await pool.query(`
        INSERT INTO subscription_packages (name, description, price, trial_days)
        VALUES (Test Package, Test description, 29.99, 14)
      `);
      console.log("Test package inserted successfully");
    } catch (e) {
      console.log("Insert error:", e.message);
    }

  } catch (error) {
    console.error("General error:", error.message);
  } finally {
    await pool.end();
  }
}

checkAndFixSubscriptionPackages();
