const { Pool } = require('pg');

// Debug contract creation issue
async function debugContractCreation() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    console.log("Debugging contract creation issue...\n");

    // First, check what columns actually exist in the bookings table
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `;

    const columnsResult = await pool.query(columnsQuery);

    console.log("ACTUAL bookings table columns:");
    console.log("=".repeat(50));
    const actualColumns = [];
    columnsResult.rows.forEach(col => {
      actualColumns.push(col.column_name);
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log("\n" + "=".repeat(50));
    console.log("CONTRACT INSERT QUERY ANALYSIS");
    console.log("=".repeat(50));

    // These are the columns our INSERT query is trying to use
    const insertColumns = [
      'tenant_id', 'event_name', 'event_type', 'customer_id', 'venue_id', 'space_id',
      'event_date', 'end_date', 'start_time', 'end_time', 'guest_count',
      'setup_style', 'status', 'total_amount', 'deposit_amount', 'notes',
      'contract_id', 'is_multi_day', 'proposal_id', 'proposal_status',
      'proposal_sent_at', 'created_at'
    ];

    console.log("\nColumns our INSERT query expects:");
    insertColumns.forEach(col => {
      const exists = actualColumns.includes(col);
      console.log(`  ${col}: ${exists ? '✅ exists' : '❌ MISSING'}`);
    });

    // Find the problematic columns
    const missingColumns = insertColumns.filter(col => !actualColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log("\n🔥 PROBLEMATIC COLUMNS FOUND:");
      console.log("=".repeat(50));
      missingColumns.forEach(col => {
        console.log(`❌ ${col} - Column does not exist in database`);
      });

      console.log("\n💡 SOLUTION:");
      console.log("Remove missing columns from the INSERT query or make them optional");

      // Create a corrected INSERT query
      const validColumns = insertColumns.filter(col => actualColumns.includes(col));
      console.log("\nCorrected column list should be:");
      console.log(validColumns.join(', '));

      // Show the corrected INSERT structure
      const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
      console.log("\nCorrected INSERT query structure:");
      console.log(`INSERT INTO bookings (${validColumns.join(', ')}) VALUES (${placeholders})`);
    } else {
      console.log("\n✅ All columns exist - the issue might be elsewhere");
    }

    // Test a simple INSERT with minimal required fields
    console.log("\n" + "=".repeat(50));
    console.log("TESTING MINIMAL INSERT");
    console.log("=".repeat(50));

    const minimalColumns = ['tenant_id', 'event_name', 'event_type', 'event_date', 'start_time', 'end_time', 'guest_count', 'status'];
    const missingMinimal = minimalColumns.filter(col => !actualColumns.includes(col));

    if (missingMinimal.length === 0) {
      console.log("✅ Minimal required columns all exist");
      console.log("A minimal INSERT should work with these columns:", minimalColumns.join(', '));
    } else {
      console.log("❌ Even minimal columns are missing:", missingMinimal.join(', '));
    }

  } catch (error) {
    console.error('Error debugging contract creation:', error.message);
  } finally {
    await pool.end();
  }
}

debugContractCreation();