/**
 * Script to remove max_bookings_per_month column from subscription_packages table
 * Run this script to clean up the database after removing max bookings functionality
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function removeMaxBookingsColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting max bookings column cleanup...');
    
    // Remove max_bookings_per_month column from subscription_packages table
    console.log('1. Removing max_bookings_per_month column from subscription_packages...');
    await client.query('ALTER TABLE subscription_packages DROP COLUMN IF EXISTS max_bookings_per_month CASCADE;');
    
    // Show current subscription packages structure
    console.log('2. Current subscription packages structure:');
    const packagesResult = await client.query(
      "SELECT id, name, price, billing_interval, max_venues, max_users FROM subscription_packages ORDER BY name"
    );
    packagesResult.rows.forEach(pkg => {
      console.log(`   📦 ${pkg.name}: $${pkg.price}/${pkg.billing_interval} (${pkg.max_venues} venues, ${pkg.max_users} users)`);
    });
    
    console.log('✅ Max bookings column cleanup completed successfully!');
    console.log('   🎉 All packages now have unlimited bookings');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the cleanup
removeMaxBookingsColumn().catch(console.error);