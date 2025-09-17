const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSubscriptionPackagesTable() {
  try {
    console.log("Creating subscription_packages table...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_packages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        billing_cycle VARCHAR(50) NOT NULL DEFAULT monthly,
        trial_days INTEGER DEFAULT 0,
        max_venues INTEGER DEFAULT 1,
        max_users INTEGER DEFAULT 1,
        max_bookings_per_month INTEGER DEFAULT 100,
        features TEXT DEFAULT [],
        is_active BOOLEAN DEFAULT true,
        is_popular BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("subscription_packages table created successfully");

    // Insert starter package
    await pool.query(`
      INSERT INTO subscription_packages (
        name, description, price, billing_cycle, trial_days,
        max_venues, max_users, max_bookings_per_month, features,
        is_popular, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (name) DO NOTHING
    `, [
      "Starter", 
      "Perfect for small venues getting started", 
      29.99, 
      "monthly", 
      14, 
      1, 
      2, 
      50,
      JSON.stringify(["Basic booking management", "Customer database", "Basic reporting"]),
      false, 
      1
    ]);

    console.log("Starter package created");

    // Show the created packages
    const packages = await pool.query("SELECT * FROM subscription_packages ORDER BY sort_order");
    console.log("\nCreated subscription packages:");
    packages.rows.forEach(pkg => {
      console.log(`${pkg.name}: $${pkg.price}/${pkg.billing_cycle}, ${pkg.trial_days} day trial`);
    });

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createSubscriptionPackagesTable();
