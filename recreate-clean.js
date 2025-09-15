const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function recreateSubscriptionPackages() {
  try {
    console.log("Dropping existing table...");
    await pool.query("DROP TABLE IF EXISTS subscription_packages CASCADE");
    
    console.log("Creating new subscription_packages table...");
    await pool.query(`
      CREATE TABLE subscription_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        billing_interval VARCHAR(50) DEFAULT 'monthly',
        trial_days INTEGER DEFAULT 0,
        max_venues INTEGER DEFAULT 1,
        max_users INTEGER DEFAULT 1,
        max_bookings_per_month INTEGER DEFAULT 100,
        features TEXT DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Table created successfully");

    console.log("Inserting Starter package...");
    await pool.query(`
      INSERT INTO subscription_packages (
        name, description, price, billing_interval, trial_days,
        max_venues, max_users, max_bookings_per_month, 
        is_active, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, ["Starter", "Perfect for small venues", 29.99, "monthly", 14, 1, 2, 50, true, 1]);

    console.log("Starter package created");

    const result = await pool.query("SELECT name, price FROM subscription_packages");
    console.log("Current packages:", result.rows);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

recreateSubscriptionPackages();
