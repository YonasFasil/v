const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixSubscriptionPackagesData() {
  try {
    // First, clear any existing test data
    await pool.query("DELETE FROM subscription_packages WHERE name LIKE Test%");
    
    // Insert proper subscription packages
    await pool.query(`
      INSERT INTO subscription_packages (
        name, description, price, billing_interval, trial_days,
        max_venues, max_users, max_bookings_per_month, 
        is_active, sort_order
      ) VALUES 
      (Starter, Perfect for small venues, 29.99, monthly, 14, 1, 2, 50, true, 1),
      (Professional, For growing venues, 79.99, monthly, 14, 3, 5, 200, true, 2),
      (Enterprise, For large operations, 199.99, monthly, 30, -1, -1, -1, true, 3)
    `);

    console.log("Subscription packages created successfully");

    // Check what was created
    const result = await pool.query("SELECT name, price, trial_days FROM subscription_packages ORDER BY sort_order");
    console.log("Created packages:");
    result.rows.forEach(pkg => {
      console.log(`- ${pkg.name}: $${pkg.price}/month, ${pkg.trial_days} day trial`);
    });

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

fixSubscriptionPackagesData();
