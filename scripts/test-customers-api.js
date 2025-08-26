const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testCustomersAPI() {
  console.log('👥 Testing customers API endpoint...\n');
  
  const baseUrl = 'http://localhost:5006';
  
  try {
    console.log('1️⃣ Login:');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'yonasfasinnl.sl@gmail.com',
        password: 'VenueAdmin2024!'
      })
    });
    
    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${await loginResponse.text()}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log(`✅ Login successful: ${loginData.user.name}`);
    console.log(`   Tenant: ${loginData.user.tenantId}`);
    
    // Test: GET /api/customers
    console.log('\n2️⃣ Testing GET /api/customers:');
    const customersResponse = await fetch(`${baseUrl}/api/customers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (customersResponse.ok) {
      const customersData = await customersResponse.json();
      console.log(`✅ GET /api/customers: ${customersData.length} customers found`);
      if (customersData.length > 0) {
        customersData.slice(0, 3).forEach((customer, idx) => {
          console.log(`   ${idx + 1}. "${customer.name}" (${customer.email})`);
        });
        if (customersData.length > 3) {
          console.log(`   ... and ${customersData.length - 3} more customers`);
        }
      } else {
        console.log('   ℹ️  No customers found for this tenant');
      }
    } else {
      const errorText = await customersResponse.text();
      console.log(`❌ GET /api/customers failed: ${customersResponse.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
    // Test: GET /api/customers/analytics
    console.log('\n3️⃣ Testing GET /api/customers/analytics:');
    const analyticsResponse = await fetch(`${baseUrl}/api/customers/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log(`✅ GET /api/customers/analytics: Success`);
      console.log(`   Total customers: ${analyticsData.totalCustomers || 0}`);
      console.log(`   New this month: ${analyticsData.newThisMonth || 0}`);
    } else {
      const errorText = await analyticsResponse.text();
      console.log(`❌ GET /api/customers/analytics failed: ${analyticsResponse.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCustomersAPI();