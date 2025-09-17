const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAndTestSettings() {
  try {
    console.log("Creating settings table...");
    
    // Drop and recreate settings table to ensure clean state
    await pool.query("DROP TABLE IF EXISTS settings CASCADE");
    
    await pool.query(`
      CREATE TABLE settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, key)
      )
    `);
    
    console.log("Settings table created successfully");

    // Test insert and read
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    // Insert test settings
    const testSettings = [
      ["business.companyName", "Test Company"],
      ["business.companyEmail", "test@example.com"],
      ["notifications.emailNotifications", "true"]
    ];

    for (const [key, value] of testSettings) {
      await pool.query(`
        INSERT INTO settings (tenant_id, key, value)
        VALUES ($1, $2, $3)
      `, [tenantId, key, value]);
    }

    console.log("Test settings inserted");

    // Read back
    const result = await pool.query("SELECT * FROM settings WHERE tenant_id = $1 ORDER BY key", [tenantId]);
    console.log("Settings in database:");
    result.rows.forEach(row => {
      console.log(`  ${row.key} = ${row.value}`);
    });

    console.log("Settings API should now work!");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createAndTestSettings();
