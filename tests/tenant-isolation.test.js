/**
 * End-to-End Tenant Isolation Tests
 * 
 * This test suite validates that tenant isolation is working correctly
 * by testing various scenarios where data should be isolated between tenants.
 */

import { db } from '../server/db.js';
import { setTenantContext } from '../server/db/tenant-context.js';
import { storage } from '../server/storage.js';
import { users, venues, bookings, customers, proposals, tenants } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}

// Test data
const TENANT_A_ID = 'tenant-a-test-id';
const TENANT_B_ID = 'tenant-b-test-id';
const USER_A_ID = 'user-a-test-id';
const USER_B_ID = 'user-b-test-id';

async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  // Create test tenants
  await db.insert(tenants).values([
    {
      id: TENANT_A_ID,
      name: 'Tenant A Test',
      subdomain: 'tenant-a-test',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: TENANT_B_ID,
      name: 'Tenant B Test',
      subdomain: 'tenant-b-test',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]).onConflictDoNothing();
  
  // Create test users for each tenant
  await db.insert(users).values([
    {
      id: USER_A_ID,
      tenantId: TENANT_A_ID,
      username: 'user-a-test',
      name: 'User A',
      email: 'user-a@tenant-a-test.com',
      passwordHash: 'test-hash',
      role: 'tenant_admin',
      isActive: true,
      createdAt: new Date()
    },
    {
      id: USER_B_ID,
      tenantId: TENANT_B_ID,
      username: 'user-b-test',
      name: 'User B',
      email: 'user-b@tenant-b-test.com',
      passwordHash: 'test-hash',
      role: 'tenant_admin',
      isActive: true,
      createdAt: new Date()
    }
  ]).onConflictDoNothing();
  
  // Create test venues for each tenant
  await db.insert(venues).values([
    {
      id: 'venue-a-test-id',
      tenantId: TENANT_A_ID,
      name: 'Venue A',
      address: '123 Test St A',
      capacity: 100,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'venue-b-test-id', 
      tenantId: TENANT_B_ID,
      name: 'Venue B',
      address: '123 Test St B',
      capacity: 200,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]).onConflictDoNothing();
  
  // Create test customers for each tenant
  await db.insert(customers).values([
    {
      id: 'customer-a-test-id',
      tenantId: TENANT_A_ID,
      name: 'Customer A',
      email: 'customer-a@test.com',
      phone: '123-456-7890',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'customer-b-test-id',
      tenantId: TENANT_B_ID,
      name: 'Customer B',
      email: 'customer-b@test.com',
      phone: '098-765-4321',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]).onConflictDoNothing();
  
  console.log('✅ Test data setup complete');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order of dependencies
    await db.delete(bookings).where(sql`tenant_id IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db.delete(proposals).where(sql`tenant_id IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db.delete(customers).where(sql`tenant_id IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db.delete(venues).where(sql`tenant_id IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db.delete(users).where(sql`tenant_id IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    await db.delete(tenants).where(sql`id IN (${TENANT_A_ID}, ${TENANT_B_ID})`);
    
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.warn('⚠️ Cleanup warning:', error.message);
  }
}

async function testTenantContextIsolation() {
  console.log('🧪 Testing tenant context isolation...');
  
  // Test 1: Set tenant A context and verify only tenant A data is visible
  await setTenantContext({
    tenantId: TENANT_A_ID,
    userId: USER_A_ID,
    role: 'tenant_admin'
  });
  
  const venuesA = await storage.getVenues();
  const customersA = await storage.getCustomers();
  
  assert(venuesA.length >= 1, 'Tenant A should see at least 1 venue');
  assert(venuesA.every(v => v.tenantId === TENANT_A_ID), 'All venues should belong to tenant A');
  assert(customersA.every(c => c.tenantId === TENANT_A_ID), 'All customers should belong to tenant A');
  
  // Test 2: Switch to tenant B context and verify only tenant B data is visible
  await setTenantContext({
    tenantId: TENANT_B_ID,
    userId: USER_B_ID,
    role: 'tenant_admin'
  });
  
  const venuesB = await storage.getVenues();
  const customersB = await storage.getCustomers();
  
  assert(venuesB.length >= 1, 'Tenant B should see at least 1 venue');
  assert(venuesB.every(v => v.tenantId === TENANT_B_ID), 'All venues should belong to tenant B');
  assert(customersB.every(c => c.tenantId === TENANT_B_ID), 'All customers should belong to tenant B');
  
  // Test 3: Verify no cross-tenant data leakage
  const venueAIds = venuesA.map(v => v.id);
  const venueBIds = venuesB.map(v => v.id);
  const intersection = venueAIds.filter(id => venueBIds.includes(id));
  
  assertEqual(intersection.length, 0, 'No venues should be visible to both tenants');
  
  console.log('✅ Tenant context isolation test passed');
}

async function testRowLevelSecurityPolicies() {
  console.log('🧪 Testing Row-Level Security policies...');
  
  // Test 1: Verify RLS is enabled on key tables
  const rlsTables = ['venues', 'customers', 'bookings', 'proposals', 'users'];
  
  for (const tableName of rlsTables) {
    const result = await db.execute(sql`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE relname = ${tableName}
    `);
    
    assert(result.rows[0]?.relrowsecurity === true, `RLS should be enabled on ${tableName} table`);
  }
  
  // Test 2: Verify tenant isolation policies exist
  const policies = await db.execute(sql`
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE policyname LIKE '%tenant_isolation%'
  `);
  
  assert(policies.rows.length >= rlsTables.length, 'Tenant isolation policies should exist for all tables');
  
  console.log('✅ Row-Level Security policies test passed');
}

async function testCrossContaminationPrevention() {
  console.log('🧪 Testing cross-contamination prevention...');
  
  // Set context to tenant A
  await setTenantContext({
    tenantId: TENANT_A_ID,
    userId: USER_A_ID,
    role: 'tenant_admin'
  });
  
  // Try to query tenant B's data directly
  const tenantBVenues = await db.select()
    .from(venues)
    .where(eq(venues.tenantId, TENANT_B_ID));
  
  // Should return empty result due to RLS
  assertEqual(tenantBVenues.length, 0, 'Should not be able to access other tenant data directly');
  
  // Test with different entity types
  const tenantBCustomers = await db.select()
    .from(customers)
    .where(eq(customers.tenantId, TENANT_B_ID));
  
  assertEqual(tenantBCustomers.length, 0, 'Should not be able to access other tenant customers');
  
  console.log('✅ Cross-contamination prevention test passed');
}

async function testSuperAdminAccess() {
  console.log('🧪 Testing super admin access...');
  
  // Set context to super admin
  await setTenantContext({
    tenantId: 'super_admin',
    userId: 'super-admin-test',
    role: 'super_admin'
  });
  
  // Super admin should see all data across tenants
  const allVenues = await storage.getVenues();
  const allCustomers = await storage.getCustomers();
  
  const tenantAVenues = allVenues.filter(v => v.tenantId === TENANT_A_ID);
  const tenantBVenues = allVenues.filter(v => v.tenantId === TENANT_B_ID);
  
  assert(tenantAVenues.length >= 1, 'Super admin should see tenant A venues');
  assert(tenantBVenues.length >= 1, 'Super admin should see tenant B venues');
  
  console.log('✅ Super admin access test passed');
}

async function runAllTests() {
  console.log('🚀 Starting Tenant Isolation E2E Tests');
  console.log('=====================================');
  
  try {
    await setupTestData();
    
    await testTenantContextIsolation();
    await testRowLevelSecurityPolicies();
    await testCrossContaminationPrevention();
    await testSuperAdminAccess();
    
    console.log('');
    console.log('🎉 All tenant isolation tests PASSED!');
    console.log('🔒 Tenant isolation is working correctly');
    
  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED:', error.message);
    console.error('🚨 TENANT ISOLATION ISSUE DETECTED');
    process.exit(1);
    
  } finally {
    await cleanupTestData();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(() => {
      console.log('✨ Test execution completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { runAllTests };