const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixSubscriptionPackagesSchema() {
  try {
    console.log("Fixing subscription_packages table schema...");
    
    // Add missing columns that the API expects
    const columnsToAdd = [
      ["billing_interval", "VARCHAR(50) DEFAULT monthly"],
      ["max_venues", "INTEGER DEFAULT 1"],
      ["max_users", "INTEGER DEFAULT 3"], 
      ["max_bookings_per_month", "INTEGER DEFAULT 100"],
      ["features", "TEXT DEFAULT []"],
      ["is_active", "BOOLEAN DEFAULT true"],
      ["sort_order", "INTEGER DEFAULT 0"]
    ];

    for (const [colName, colDef] of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE subscription_packages ADD COLUMN ${colName} ${colDef}`);
        console.log(`Added column: ${colName}`);
      } catch (e) {
        if (e.message.includes("already exists")) {
          console.log(`Column ${colName} already exists`);
        } else {
          console.error(`Error adding ${colName}:`, e.message);
        }
      }
    }

    // Check final structure
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = subscription_packages
      ORDER BY ordinal_position
    `);
    
    console.log("\nFinal table structure:");
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // Insert starter package
    console.log("\nInserting starter package...");
    await pool.query(`
      INSERT INTO subscription_packages (
        name, description, price, billing_interval, trial_days,
        max_venues, max_users, max_bookings_per_month, features,
        is_active, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      "Starter", 
      "Perfect for small venues", 
      29.99, 
      "monthly", 
      14, 
      1, 
      2, 
      50,
      JSON.stringify(["Basic booking", "Customer database"]),
      true, 
      1
    ]);

    console.log("Schema fixed successfully!");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixSubscriptionPackagesSchema();
