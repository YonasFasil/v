const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAndCreateSettings() {
  try {
    // Check if settings table exists at all
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = public
        AND table_name = settings
      );
    `);

    console.log("Settings table exists:", tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log("Creating settings table...");
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
      console.log("Settings table created");
    } else {
      // Check structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = settings
        ORDER BY ordinal_position
      `);
      console.log("Settings table structure:", structure.rows);
    }

    // Test a simple insert
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    await pool.query(`
      INSERT INTO settings (tenant_id, key, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (tenant_id, key) DO UPDATE SET value = $3
    `, [tenantId, "test.key", "test value"]);

    console.log("Test insert successful");

    // Read back
    const result = await pool.query("SELECT * FROM settings WHERE tenant_id = $1", [tenantId]);
    console.log("Settings in database:", result.rows);

  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

checkAndCreateSettings();
