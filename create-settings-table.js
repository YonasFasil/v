const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSettings() {
  try {
    // Check if there is a settings table in our table list
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = public AND tablename LIKE %setting% ORDER BY tablename");
    console.log("Settings-related tables:", tables.rows.map(r => r.tablename));

    // Try to create the settings table
    console.log("Creating settings table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
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

    // Insert some default settings
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    const defaultSettings = [
      [business.companyName, My Venue Company],
      [business.companyEmail, contact@venue.com],
      [business.timezone, America/New_York],
      [business.currency, USD]
    ];

    for (const [key, value] of defaultSettings) {
      await pool.query(`
        INSERT INTO settings (tenant_id, key, value, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (tenant_id, key) DO NOTHING
      `, [tenantId, key, value]);
    }

    console.log("Default settings created");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkSettings();
