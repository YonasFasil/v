const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSubscriptionPackages() {
  try {
    // Simple table creation
    await pool.query(`
      CREATE TABLE subscription_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        trial_days INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log("Table created");

  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("Table already exists");
      
      // Add trial_days column if missing
      try {
        await pool.query("ALTER TABLE subscription_packages ADD COLUMN trial_days INTEGER DEFAULT 0");
        console.log("Added trial_days column");
      } catch (e) {
        if (e.message.includes("already exists")) {
          console.log("trial_days column already exists");
        } else {
          console.error("Error adding column:", e.message);
        }
      }
    } else {
      console.error("Error:", error.message);
    }
  } finally {
    await pool.end();
  }
}

createSubscriptionPackages();
