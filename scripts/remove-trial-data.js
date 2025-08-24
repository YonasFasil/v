/**
 * Script to remove all trial-related data from the database
 * Run this script to clean up existing trial data after removing trial functionality
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function removeTrialData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting trial data cleanup...');
    
    // 1. Remove trial_days column from subscription_packages table
    console.log('1. Removing trial_days column from subscription_packages...');
    await client.query('ALTER TABLE subscription_packages DROP COLUMN IF EXISTS trial_days CASCADE;');
    
    // 2. Remove trial_ends_at column from tenants table
    console.log('2. Removing trial_ends_at column from tenants...');
    await client.query('ALTER TABLE tenants DROP COLUMN IF EXISTS trial_ends_at CASCADE;');
    
    // 3. Update all tenant statuses from 'trial' to 'active'
    console.log('3. Converting all trial tenants to active status...');
    const { rowCount: tenantUpdates } = await client.query(
      "UPDATE tenants SET status = 'active' WHERE status = 'trial'"
    );
    console.log(`   ✅ Updated ${tenantUpdates} tenants from trial to active status`);
    
    // 4. Show current tenant status distribution
    console.log('4. Current tenant status distribution:');
    const statusResult = await client.query(
      "SELECT status, COUNT(*) as count FROM tenants GROUP BY status ORDER BY status"
    );
    statusResult.rows.forEach(row => {
      console.log(`   📊 ${row.status}: ${row.count} tenants`);
    });
    
    // 5. Show current subscription packages (should not have trial_days)
    console.log('5. Current subscription packages:');
    const packagesResult = await client.query(
      "SELECT id, name, price, max_venues, max_users, max_bookings_per_month FROM subscription_packages ORDER BY name"
    );
    packagesResult.rows.forEach(pkg => {
      console.log(`   📦 ${pkg.name}: $${pkg.price} (${pkg.max_venues} venues, ${pkg.max_users} users, ${pkg.max_bookings_per_month} bookings/month)`);
    });
    
    console.log('✅ Trial data cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
removeTrialData().catch(console.error);