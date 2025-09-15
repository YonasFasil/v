const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTable() {
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
        features TEXT DEFAULT ,
        is_active BOOLEAN DEFAULT true,
        is_popular BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Table created successfully");

    // Just show structure
    const structure = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = subscription_packages ORDER BY ordinal_position");
    console.log("Table structure:");
    structure.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

createTable();
