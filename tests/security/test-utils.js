const { Pool } = require('pg');
const crypto = require('crypto');

/**
 * Test utilities for security test isolation
 * 
 * Provides helpers to create isolated test data and clean up
 * after tests to prevent cross-test contamination.
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/venuedb"
});

// Generate unique test run ID
const TEST_RUN_ID = crypto.randomUUID().substring(0, 8);
console.log(`🧪 Test run ID: ${TEST_RUN_ID}`);

/**
 * Create test tenant data with unique identifiers
 */
async function createTestTenant(suffix = '') {
  const testId = `test_${TEST_RUN_ID}${suffix ? '_' + suffix : ''}`;
  
  try {
    const tenant = await pool.query(`
      INSERT INTO tenants (id, name, slug, status, subscription_package_id, created_at)
      VALUES ($1, $2, $3, 'active', (SELECT id FROM subscription_packages LIMIT 1), NOW())
      RETURNING *
    `, [
      `${testId}_tenant_id`,
      `Test Tenant ${testId}`,
      `test-tenant-${testId}`
    ]);
    
    console.log(`✅ Created test tenant: ${tenant.rows[0].name}`);
    return tenant.rows[0];
  } catch (error) {
    console.warn(`⚠️  Could not create test tenant: ${error.message}`);
    return null;
  }
}

/**
 * Create test user data
 */
async function createTestUser(tenantId, suffix = '') {
  const testId = `test_${TEST_RUN_ID}${suffix ? '_' + suffix : ''}`;
  
  try {
    const user = await pool.query(`
      INSERT INTO users (id, tenant_id, name, email, role, username, created_at)
      VALUES ($1, $2, $3, $4, 'tenant_admin', $5, NOW())
      RETURNING *
    `, [
      `${testId}_user_id`,
      tenantId,
      `Test User ${testId}`,
      `testuser_${testId}@example.com`,
      `testuser_${testId}`
    ]);
    
    console.log(`✅ Created test user: ${user.rows[0].email}`);
    return user.rows[0];
  } catch (error) {
    console.warn(`⚠️  Could not create test user: ${error.message}`);
    return null;
  }
}

/**
 * Create test customer data
 */
async function createTestCustomer(tenantId, suffix = '') {
  const testId = `test_${TEST_RUN_ID}${suffix ? '_' + suffix : ''}`;
  
  try {
    const customer = await pool.query(`
      INSERT INTO customers (id, tenant_id, name, email, phone, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [
      `${testId}_customer_id`,
      tenantId,
      `Test Customer ${testId}`,
      `testcustomer_${testId}@example.com`,
      `555-${testId}`
    ]);
    
    console.log(`✅ Created test customer: ${customer.rows[0].email}`);
    return customer.rows[0];
  } catch (error) {
    console.warn(`⚠️  Could not create test customer: ${error.message}`);
    return null;
  }
}

/**
 * Create test venue data
 */
async function createTestVenue(tenantId, suffix = '') {
  const testId = `test_${TEST_RUN_ID}${suffix ? '_' + suffix : ''}`;
  
  try {
    const venue = await pool.query(`
      INSERT INTO venues (id, tenant_id, name, description, capacity, created_at)
      VALUES ($1, $2, $3, $4, 100, NOW())
      RETURNING *
    `, [
      `${testId}_venue_id`,
      tenantId,
      `Test Venue ${testId}`,
      `Test venue for security testing - ${testId}`
    ]);
    
    console.log(`✅ Created test venue: ${venue.rows[0].name}`);
    return venue.rows[0];
  } catch (error) {
    console.warn(`⚠️  Could not create test venue: ${error.message}`);
    return null;
  }
}

/**
 * Clean up all test data for this test run
 */
async function cleanupTestData() {
  console.log(`🧹 Cleaning up test data for run ${TEST_RUN_ID}...`);
  
  try {
    // Clean up in reverse dependency order
    const cleanupQueries = [
      `DELETE FROM bookings WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR customer_id LIKE '%test_${TEST_RUN_ID}%' OR venue_id LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM proposals WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR customer_id LIKE '%test_${TEST_RUN_ID}%' OR venue_id LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM payments WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR booking_id LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM communications WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR customer_id LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM tasks WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR assigned_to LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM leads WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR venue_id LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM customers WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR email LIKE '%test_${TEST_RUN_ID}%'`,
      `DELETE FROM venues WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR name LIKE '%Test Venue%test_${TEST_RUN_ID}%'`,
      `DELETE FROM users WHERE tenant_id LIKE '%test_${TEST_RUN_ID}%' OR email LIKE '%testuser_test_${TEST_RUN_ID}%'`,
      `DELETE FROM admin_audit WHERE reason LIKE '%test_${TEST_RUN_ID}%' OR reason LIKE '%Testing%'`,
      `DELETE FROM tenants WHERE slug LIKE '%test-tenant-test_${TEST_RUN_ID}%' OR name LIKE '%Test Tenant%test_${TEST_RUN_ID}%'`
    ];
    
    for (const query of cleanupQueries) {
      try {
        const result = await pool.query(query);
        if (result.rowCount > 0) {
          console.log(`   Cleaned ${result.rowCount} records`);
        }
      } catch (error) {
        console.warn(`   Warning: ${error.message}`);
      }
    }
    
    console.log(`✅ Test data cleanup completed for run ${TEST_RUN_ID}`);
  } catch (error) {
    console.warn(`⚠️  Cleanup warning: ${error.message}`);
  }
}

/**
 * Setup test isolation environment
 */
async function setupTestEnvironment() {
  console.log(`🧪 Setting up isolated test environment (${TEST_RUN_ID})...`);
  
  // Clean up any existing test data first
  await cleanupTestData();
  
  console.log('✅ Test environment ready');
}

/**
 * Teardown test isolation environment
 */
async function teardownTestEnvironment() {
  console.log(`🧹 Tearing down test environment (${TEST_RUN_ID})...`);
  
  // Clean up test data
  await cleanupTestData();
  
  // Close database connection
  await pool.end();
  
  console.log('✅ Test environment cleaned up');
}

/**
 * Get test run ID for unique data identification
 */
function getTestRunId() {
  return TEST_RUN_ID;
}

module.exports = {
  createTestTenant,
  createTestUser,
  createTestCustomer,
  createTestVenue,
  cleanupTestData,
  setupTestEnvironment,
  teardownTestEnvironment,
  getTestRunId,
  pool
};