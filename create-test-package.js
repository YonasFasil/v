const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestPackage() {
  try {
    const tenantResult = await pool.query("SELECT id FROM tenants LIMIT 1");
    const tenantId = tenantResult.rows[0].id;

    // Check if we have any services first
    const services = await pool.query("SELECT * FROM services WHERE tenant_id = $1 LIMIT 3", [tenantId]);
    console.log("Available services:", services.rows.length);

    if (services.rows.length === 0) {
      console.log("Creating test service first...");
      const newService = await pool.query(`
        INSERT INTO services (tenant_id, name, description, category, price, pricing_model, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [tenantId, "Test Photography", "Professional photography service", "photography", 500, "fixed", true]);
      
      console.log("Created test service:", newService.rows[0]);
    }

    // Get services again
    const availableServices = await pool.query("SELECT * FROM services WHERE tenant_id = $1", [tenantId]);
    const serviceIds = availableServices.rows.map(s => s.id);
    
    console.log("Service IDs to include:", serviceIds);

    // Create test package
    const packageData = await pool.query(`
      INSERT INTO packages (tenant_id, name, description, category, price, pricing_model, included_service_ids, enabled_tax_ids, enabled_fee_ids, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      tenantId,
      "Test Wedding Package", 
      "Complete wedding package",
      "wedding",
      2000,
      "fixed",
      serviceIds.slice(0, 2), // Include first 2 services
      [],
      [],
      true
    ]);

    console.log("Created test package:");
    console.log(JSON.stringify(packageData.rows[0], null, 2));

    // Now test what the packages API would return
    const packages = await pool.query("SELECT * FROM packages WHERE tenant_id = $1", [tenantId]);
    console.log("\nAll packages:");
    console.log(JSON.stringify(packages.rows, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createTestPackage();
