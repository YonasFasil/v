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
        features JSONB DEFAULT [],
        is_active BOOLEAN DEFAULT true,
        is_popular BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("subscription_packages table created successfully");

    // Insert default subscription packages
    await pool.query(`
      INSERT INTO subscription_packages (
        name, description, price, billing_cycle, trial_days,
        max_venues, max_users, max_bookings_per_month, features,
        is_popular, sort_order
      ) VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11),
      ($12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb, $21, $22),
      ($23, $24, $25, $26, $27, $28, $29, $30, $31::jsonb, $32, $33)
      ON CONFLICT (name) DO NOTHING
    `, [
      "Starter", "Perfect for small venues getting started", 29.99, "monthly", 14, 1, 2, 50, 
      JSON.stringify(["Basic booking management", "Customer database", "Basic reporting"]), false, 1,
      
      "Professional", "For growing venue businesses", 79.99, "monthly", 14, 3, 5, 200,
      JSON.stringify(["Advanced booking management", "Multiple venues", "Advanced reporting", "Customer analytics", "Email automation"]), true, 2,
      
      "Enterprise", "For large venue operations", 199.99, "monthly", 30, -1, -1, -1,
      JSON.stringify(["Everything in Professional", "Unlimited venues", "Unlimited users", "Priority support", "Custom integrations", "White-label options"]), false, 3
    ]);

    console.log("Default subscription packages created");

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
