const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestCustomers() {
  try {
    // Get the first tenant (likely the one being used)
    const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
    if (tenantResult.rows.length === 0) {
      console.log('No tenants found!');
      return;
    }

    const tenantId = tenantResult.rows[0].id;
    console.log('Using tenant ID:', tenantId);

    // Check if customers table exists and its structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);

    console.log('Customers table structure:');
    console.log(tableInfo.rows);

    // Check if any customers already exist
    const existingCount = await pool.query('SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1', [tenantId]);
    console.log('Existing customers for this tenant:', existingCount.rows[0].count);

    if (existingCount.rows[0].count > 0) {
      console.log('Customers already exist, skipping creation');
      const existing = await pool.query('SELECT * FROM customers WHERE tenant_id = $1 LIMIT 3', [tenantId]);
      console.log('Sample existing customers:');
      console.log(JSON.stringify(existing.rows, null, 2));
      return;
    }

    // Create test customers
    const customers = [
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '555-0123',
        status: 'customer',
        customerType: 'individual',
        notes: 'VIP customer'
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '555-0124',
        status: 'lead',
        customerType: 'individual',
        notes: 'Interested in wedding package'
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        phone: '555-0125',
        status: 'customer',
        customerType: 'individual',
        notes: 'Regular corporate events'
      }
    ];

    for (const customer of customers) {
      try {
        const result = await pool.query(`
          INSERT INTO customers (tenant_id, name, email, phone, status, customer_type, notes, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `, [tenantId, customer.name, customer.email, customer.phone, customer.status, customer.customerType, customer.notes]);

        console.log('Created customer:', result.rows[0].name);
      } catch (error) {
        console.error('Error creating customer:', customer.name, error.message);
      }
    }

    console.log('Test customers created successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestCustomers();