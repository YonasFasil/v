const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPackagesAPI() {
  try {
    // Get the first tenant
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    if (tenantResult.rows.length === 0) {
      console.log("No tenants found!");
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log("Using tenant ID:", tenantId);

    // Check if packages table exists
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = "packages"
      ORDER BY ordinal_position
    `);

    console.log("Packages table structure:");
    console.log(tableInfo.rows);

    // Check existing packages
    const existingCount = await pool.query("SELECT COUNT(*) as count FROM packages WHERE tenant_id = $1", [tenantId]);
    console.log("Existing packages for this tenant:", existingCount.rows[0].count);

    const existing = await pool.query("SELECT * FROM packages WHERE tenant_id = $1 LIMIT 3", [tenantId]);
    console.log("Sample existing packages:");
    console.log(JSON.stringify(existing.rows, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

testPackagesAPI();
