const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixSubscriptionPackagesSchema() {
  try {
    console.log("Fixing subscription_packages table schema...");
    
    // Add missing columns that the API expects
    const columnsToAdd = [
      "billing_interval VARCHAR(50) DEFAULT monthly",
      "max_venues INTEGER DEFAULT 1",
      "max_users INTEGER DEFAULT 3", 
      "max_bookings_per_month INTEGER DEFAULT 100",
      "features TEXT DEFAULT []",
      "is_active BOOLEAN DEFAULT true",
      "sort_order INTEGER DEFAULT 0"
    ];

    for (const column of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE subscription_packages ADD COLUMN ${column}`);
        console.log(`Added column: ${column.split( )[0]}`);
      } catch (e) {
        if (e.message.includes("already exists")) {
          console.log(`Column ${column.split( )[0]} already exists`);
        } else {
          console.error(`Error adding ${column.split( )[0]}:`, e.message);
        }
      }
    }

    // Check final structure
    const structure = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = subscription_packages
      ORDER BY ordinal_position
    `);
    
    console.log("\nFinal table structure:");
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (default: ${col.column_default || none})`);
    });

    // Insert default packages
    console.log("\nInserting default packages...");
    const packages = [
      {
        name: "Starter",
        description: "Perfect for small venues",
        price: 29.99,
        billing_interval: "monthly",
        trial_days: 14,
        max_venues: 1,
        max_users: 2,
        max_bookings_per_month: 50,
        features: [Basic booking, Customer database],
        is_active: true,
        sort_order: 1
      },
      {
        name: "Professional", 
        description: "For growing venues",
        price: 79.99,
        billing_interval: "monthly",
        trial_days: 14,
        max_venues: 3,
        max_users: 5,
        max_bookings_per_month: 200,
        features: [Advanced booking, Multiple venues, Analytics],
        is_active: true,
        sort_order: 2
      }
    ];

    for (const pkg of packages) {
      try {
        await pool.query(`
          INSERT INTO subscription_packages (
            name, description, price, billing_interval, trial_days,
            max_venues, max_users, max_bookings_per_month, features,
            is_active, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (name) DO NOTHING
        `, [
          pkg.name, pkg.description, pkg.price, pkg.billing_interval, 
          pkg.trial_days, pkg.max_venues, pkg.max_users, 
          pkg.max_bookings_per_month, pkg.features, pkg.is_active, pkg.sort_order
        ]);
        console.log(`Inserted package: ${pkg.name}`);
      } catch (e) {
        console.log(`Package ${pkg.name} may already exist`);
      }
    }

    console.log("\nSchema fixed successfully\!");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixSubscriptionPackagesSchema();
