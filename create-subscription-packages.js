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
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        billing_cycle VARCHAR(50) NOT NULL DEFAULT monthly, -- monthly, yearly, one_time
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
    const defaultPackages = [
      {
        name: "Starter",
        description: "Perfect for small venues getting started",
        price: 29.99,
        billing_cycle: "monthly",
        trial_days: 14,
        max_venues: 1,
        max_users: 2,
        max_bookings_per_month: 50,
        features: JSON.stringify(["Basic booking management", "Customer database", "Basic reporting"]),
        is_popular: false,
        sort_order: 1
      },
      {
        name: "Professional",
        description: "For growing venue businesses",
        price: 79.99,
        billing_cycle: "monthly", 
        trial_days: 14,
        max_venues: 3,
        max_users: 5,
        max_bookings_per_month: 200,
        features: JSON.stringify(["Advanced booking management", "Multiple venues", "Advanced reporting", "Customer analytics", "Email automation"]),
        is_popular: true,
        sort_order: 2
      },
      {
        name: "Enterprise",
        description: "For large venue operations",
        price: 199.99,
        billing_cycle: "monthly",
        trial_days: 30,
        max_venues: -1, // unlimited
        max_users: -1, // unlimited
        max_bookings_per_month: -1, // unlimited
        features: JSON.stringify(["Everything in Professional", "Unlimited venues", "Unlimited users", "Priority support", "Custom integrations", "White-label options"]),
        is_popular: false,
        sort_order: 3
      }
    ];

    for (const pkg of defaultPackages) {
      await pool.query(`
        INSERT INTO subscription_packages (
          name, description, price, billing_cycle, trial_days,
          max_venues, max_users, max_bookings_per_month, features,
          is_popular, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      `, [
        pkg.name, pkg.description, pkg.price, pkg.billing_cycle, pkg.trial_days,
        pkg.max_venues, pkg.max_users, pkg.max_bookings_per_month, pkg.features,
        pkg.is_popular, pkg.sort_order
      ]);
    }

    console.log("Default subscription packages created");

    // Show the created packages
    const packages = await pool.query("SELECT * FROM subscription_packages ORDER BY sort_order");
    console.log("\nCreated subscription packages:");
    console.log(JSON.stringify(packages.rows, null, 2));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createSubscriptionPackagesTable();
