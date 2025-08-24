const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:ZxOp1029!!%%@localhost:5432/venuedb"
});

async function testDeleteTenant() {
  try {
    console.log('🗑️ Testing Tenant Delete Functionality\n');

    // Show current tenants
    console.log('🏢 Current Tenants:');
    const tenantsResult = await pool.query(`
      SELECT t.id, t.name, t.status, t.slug, 
             COUNT(u.id) as user_count,
             sp.name as package_name
      FROM tenants t 
      LEFT JOIN users u ON u.tenant_id = t.id 
      LEFT JOIN subscription_packages sp ON t.subscription_package_id = sp.id
      GROUP BY t.id, t.name, t.status, t.slug, sp.name
      ORDER BY t.name
    `);
    
    console.log(`Found ${tenantsResult.rows.length} tenants:\n`);
    tenantsResult.rows.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Users: ${tenant.user_count}`);
      console.log(`   Package: ${tenant.package_name || 'None'}`);
      console.log(`   ID: ${tenant.id}\n`);
    });

    // Check for data that would be deleted
    console.log('🔍 Checking tenant data that would be CASCADE DELETED:');
    
    for (const tenant of tenantsResult.rows.slice(0, 3)) { // Check first 3 tenants as example
      console.log(`\n📊 Data for "${tenant.name}":`);
      
      // Count users
      const userCount = await pool.query(`
        SELECT COUNT(*) as count FROM users WHERE tenant_id = $1
      `, [tenant.id]);
      
      // Count venues
      const venueCount = await pool.query(`
        SELECT COUNT(*) as count FROM venues WHERE tenant_id = $1
      `, [tenant.id]);
      
      // Count bookings  
      const bookingCount = await pool.query(`
        SELECT COUNT(*) as count FROM bookings WHERE tenant_id = $1
      `, [tenant.id]);
      
      // Count customers
      const customerCount = await pool.query(`
        SELECT COUNT(*) as count FROM customers WHERE tenant_id = $1
      `, [tenant.id]);

      console.log(`   👥 Users: ${userCount.rows[0].count}`);
      console.log(`   🏢 Venues: ${venueCount.rows[0].count}`);
      console.log(`   📅 Bookings: ${bookingCount.rows[0].count}`);
      console.log(`   👤 Customers: ${customerCount.rows[0].count}`);
      
      if (parseInt(userCount.rows[0].count) === 0 && 
          parseInt(venueCount.rows[0].count) === 0 && 
          parseInt(bookingCount.rows[0].count) === 0 && 
          parseInt(customerCount.rows[0].count) === 0) {
        console.log(`   ✅ Safe to delete (no data)`);
      } else {
        console.log(`   ⚠️  Contains data - deletion will CASCADE DELETE all above data`);
      }
    }

    console.log('\n🧪 DELETE TESTING SUMMARY:');
    console.log('1. Frontend shows delete button (red trash icon) next to each tenant');
    console.log('2. Clicking delete shows confirmation with strong warning about data loss');
    console.log('3. Backend DELETE endpoint cascades to delete ALL tenant data:');
    console.log('   - Users and their permissions');
    console.log('   - Venues and spaces');
    console.log('   - Bookings and events'); 
    console.log('   - Customers and proposals');
    console.log('   - Payments and communications');
    console.log('   - Settings and configurations');
    console.log('\n💡 To test tenant deletion:');
    console.log('   1. Go to Super Admin Dashboard: http://localhost:5006/super-admin');
    console.log('   2. Login as admin@yourdomain.com / admin123');
    console.log('   3. Go to Tenants tab');
    console.log('   4. Click the red trash icon next to any tenant');
    console.log('   5. Confirm deletion in the dialog');
    console.log('\n⚠️  WARNING: Tenant deletion is PERMANENT and IRREVERSIBLE!');
    console.log('⚠️  All tenant data will be permanently deleted from the database!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testDeleteTenant();