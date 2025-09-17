const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    // List all tables
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = public ORDER BY tablename");
    console.log("Existing tables:");
    tables.rows.forEach(t => console.log(" -", t.tablename));

    // Check if subscription_packages exists
    const spExists = tables.rows.some(t => t.tablename === subscription_packages);
    console.log("\nsubscription_packages exists:", spExists);

    if (spExists) {
      const structure = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = subscription_packages ORDER BY ordinal_position");
      console.log("\nsubscription_packages structure:");
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}`);
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
