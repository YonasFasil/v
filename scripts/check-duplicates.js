const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

async function checkDuplicates() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
  });

  try {
    console.log('📋 Checking for duplicate values that would prevent unique constraints...\n');
    
    // Check customers.email duplicates per tenant
    const customerEmailDupes = await pool.query(`
      SELECT tenant_id, email, COUNT(*) as count
      FROM customers 
      WHERE email IS NOT NULL AND email != ''
      GROUP BY tenant_id, email
      HAVING COUNT(*) > 1
      ORDER BY tenant_id, email
    `);
    
    console.log('Customers email duplicates per tenant:');
    customerEmailDupes.rows.forEach(row => {
      console.log(`   Tenant ${row.tenant_id}: ${row.email} (${row.count} times)`);
    });
    
    // Check users.email duplicates per tenant
    const userEmailDupes = await pool.query(`
      SELECT tenant_id, email, COUNT(*) as count
      FROM users 
      WHERE email IS NOT NULL AND email != ''
      GROUP BY tenant_id, email
      HAVING COUNT(*) > 1
      ORDER BY tenant_id, email
    `);
    
    console.log('\nUsers email duplicates per tenant:');
    userEmailDupes.rows.forEach(row => {
      console.log(`   Tenant ${row.tenant_id}: ${row.email} (${row.count} times)`);
    });
    
    // Check venues.name duplicates per tenant
    const venueNameDupes = await pool.query(`
      SELECT tenant_id, name, COUNT(*) as count
      FROM venues 
      WHERE name IS NOT NULL AND name != ''
      GROUP BY tenant_id, name
      HAVING COUNT(*) > 1
      ORDER BY tenant_id, name
    `);
    
    console.log('\nVenues name duplicates per tenant:');
    venueNameDupes.rows.forEach(row => {
      console.log(`   Tenant ${row.tenant_id}: ${row.name} (${row.count} times)`);
    });
    
    // Check companies.email duplicates per tenant
    const companyEmailDupes = await pool.query(`
      SELECT tenant_id, email, COUNT(*) as count
      FROM companies 
      WHERE email IS NOT NULL AND email != ''
      GROUP BY tenant_id, email
      HAVING COUNT(*) > 1
      ORDER BY tenant_id, email
    `);
    
    console.log('\nCompanies email duplicates per tenant:');
    companyEmailDupes.rows.forEach(row => {
      console.log(`   Tenant ${row.tenant_id}: ${row.email} (${row.count} times)`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDuplicates();