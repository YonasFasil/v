const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testPackageData() {
  try {
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    // Get actual package data from database
    const packages = await pool.query("SELECT * FROM packages WHERE tenant_id = $1 LIMIT 3", [tenantId]);
    
    console.log("Package data from database:");
    console.log(JSON.stringify(packages.rows, null, 2));

    // Check column names
    if (packages.rows.length > 0) {
      console.log("\nPackage column names:");
      console.log(Object.keys(packages.rows[0]));
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

testPackageData();
