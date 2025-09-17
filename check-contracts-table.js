const { Pool } = require('pg');

async function checkContractsTable() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Checking contracts table structure and foreign key constraints...\n");

    // Check if contracts table exists
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'contracts'
    `;
    const tablesResult = await pool.query(tablesQuery);

    if (tablesResult.rows.length === 0) {
      console.log("❌ 'contracts' table does NOT exist");
    } else {
      console.log("✅ 'contracts' table exists");

      // Get contracts table structure
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'contracts'
        ORDER BY ordinal_position
      `;
      const columnsResult = await pool.query(columnsQuery);

      console.log("\nContracts table structure:");
      console.log("=".repeat(30));
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Check foreign key constraints on bookings table
    console.log("\n" + "=".repeat(50));
    console.log("FOREIGN KEY CONSTRAINTS ON BOOKINGS TABLE");
    console.log("=".repeat(50));

    const constraintsQuery = `
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'bookings'
        AND kcu.column_name = 'contract_id'
    `;

    const constraintsResult = await pool.query(constraintsQuery);

    if (constraintsResult.rows.length > 0) {
      console.log("Found foreign key constraint:");
      constraintsResult.rows.forEach(constraint => {
        console.log(`  ${constraint.constraint_name}:`);
        console.log(`    ${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      });
    } else {
      console.log("❌ No foreign key constraint found for contract_id");
    }

    // Check all foreign keys on bookings table
    console.log("\n" + "=".repeat(50));
    console.log("ALL FOREIGN KEY CONSTRAINTS ON BOOKINGS");
    console.log("=".repeat(50));

    const allFKQuery = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'bookings'
    `;

    const allFKResult = await pool.query(allFKQuery);
    allFKResult.rows.forEach(constraint => {
      console.log(`  ${constraint.constraint_name}:`);
      console.log(`    bookings.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });

  } catch (error) {
    console.error('Error checking contracts table:', error.message);
  } finally {
    await pool.end();
  }
}

checkContractsTable();