const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixSettingsTable() {
  try {
    // Add missing columns to settings table
    console.log("Adding missing columns to settings table...");
    
    try {
      await pool.query("ALTER TABLE settings ADD COLUMN created_at TIMESTAMP DEFAULT NOW()");
      console.log("Added created_at column");
    } catch (e) {
      if (!e.message.includes("already exists")) {
        throw e;
      }
      console.log("created_at column already exists");
    }

    try {
      await pool.query("ALTER TABLE settings ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()");
      console.log("Added updated_at column");
    } catch (e) {
      if (!e.message.includes("already exists")) {
        throw e;
      }
      console.log("updated_at column already exists");
    }

    // Now insert default settings
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    const defaultSettings = [
      ["business.companyName", "My Venue Company"],
      ["business.companyEmail", "contact@venue.com"],
      ["business.timezone", "America/New_York"],
      ["business.currency", "USD"]
    ];

    for (const [key, value] of defaultSettings) {
      await pool.query(`
        INSERT INTO settings (tenant_id, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, key) DO NOTHING
      `, [tenantId, key, value]);
    }

    console.log("Default settings created");

    // Test reading settings
    const settings = await pool.query("SELECT * FROM settings WHERE tenant_id = $1", [tenantId]);
    console.log("Current settings:", settings.rows);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixSettingsTable();
