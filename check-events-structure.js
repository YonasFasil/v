const { Pool } = require('pg');

async function checkEventsTable() {
  const databaseUrl = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📋 Events table structure:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);

    if (columns.rows.length === 0) {
      console.log('❌ Events table does not exist');
      return;
    }

    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check venues table too
    console.log('\n📋 Venues table structure:');
    const venueColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'venues'
      ORDER BY ordinal_position
    `);

    venueColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check spaces table too
    console.log('\n📋 Spaces table structure:');
    const spaceColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'spaces'
      ORDER BY ordinal_position
    `);

    spaceColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check customers table too
    console.log('\n📋 Customers table structure:');
    const customerColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);

    customerColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Get sample event data
    console.log('\n📊 Sample events data:');
    const sampleEvents = await pool.query('SELECT * FROM events LIMIT 3');
    console.log('Total events:', sampleEvents.rows.length);

    if (sampleEvents.rows.length > 0) {
      console.log('Available columns in events data:', Object.keys(sampleEvents.rows[0]));
      console.log('\nSample event:');
      const event = sampleEvents.rows[0];
      console.log(`  Title: ${event.title || 'NULL'}`);
      console.log(`  Status: ${event.status || 'NULL'}`);
      console.log(`  Start Date: ${event.start_date || 'NULL'}`);
      console.log(`  Venue ID: ${event.venue_id || 'NULL'}`);
      console.log(`  Customer ID: ${event.customer_id || 'NULL'}`);
    }

    // Test the actual events query that the API uses
    console.log('\n🧪 Testing the API query...');
    // Pick a tenant that exists
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length > 0) {
      const testTenantId = tenantResult.rows[0].id;
      console.log('Testing with tenant:', testTenantId);

      const apiQuery = await pool.query(`SELECT e.*,
               c.name as customer_name,
               v.name as venue_name,
               s.name as space_name
        FROM events e
        LEFT JOIN customers c ON e.customer_id = c.id AND c.tenant_id = $1
        LEFT JOIN venues v ON e.venue_id = v.id AND v.tenant_id = $1
        LEFT JOIN spaces s ON e.space_id = s.id
        WHERE e.tenant_id = $1 AND e.is_active = true
        ORDER BY e.start_date DESC`, [testTenantId]);

      console.log('✅ API query executed successfully!');
      console.log('Events returned:', apiQuery.rows.length);

      if (apiQuery.rows.length > 0) {
        const event = apiQuery.rows[0];
        console.log('\nSample API result:');
        console.log(`  Title: ${event.title || 'NULL'}`);
        console.log(`  Customer Name: ${event.customer_name || 'NULL'}`);
        console.log(`  Venue Name: ${event.venue_name || 'NULL'}`);
        console.log(`  Space Name: ${event.space_name || 'NULL'}`);
        console.log(`  Status: ${event.status || 'NULL'}`);
        console.log(`  Start Date: ${event.start_date || 'NULL'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

checkEventsTable();