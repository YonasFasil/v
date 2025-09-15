const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPackages() {
  try {
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;
    console.log("Using tenant ID:", tenantId);

    // Check packages table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = packages
      ORDER BY ordinal_position
    `);
    console.log("Packages table columns:", tableInfo.rows.map(r => r.column_name));

    // Check existing packages
    const packages = await pool.query("SELECT * FROM packages WHERE tenant_id = $1", [tenantId]);
    console.log("Packages count:", packages.rows.length);
    console.log("Sample packages:", JSON.stringify(packages.rows.slice(0, 2), null, 2));

    // Test creating a package
    if (packages.rows.length === 0) {
      console.log("Creating test package...");
      const result = await pool.query(`
        INSERT INTO packages (tenant_id, name, description, category, price, pricing_model, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [tenantId, "Test Package", "Test description", "general", 100, "fixed", true]);
      console.log("Created package:", result.rows[0]);
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

testPackages();
