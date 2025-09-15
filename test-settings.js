const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSettings() {
  try {
    // Check if settings table exists and its structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = settings
      ORDER BY ordinal_position
    `);
    
    console.log("Settings table columns:", tableInfo.rows.map(r => r.column_name));

    // Check existing settings
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;
    
    const settings = await pool.query("SELECT * FROM settings WHERE tenant_id = $1", [tenantId]);
    console.log("Settings count:", settings.rows.length);
    console.log("Sample settings:", JSON.stringify(settings.rows.slice(0, 3), null, 2));

    // Test the settings object conversion
    const settingsObj = {};
    settings.rows.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    console.log("Settings object:", JSON.stringify(settingsObj, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

testSettings();
