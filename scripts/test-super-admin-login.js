const axios = require('axios');

async function testSuperAdminLogin() {
  try {
    console.log('🔑 Testing super admin login...');
    
    const loginResponse = await axios.post('http://localhost:5006/api/super-admin/login', {
      email: 'admin@yourdomain.com',
      password: 'VenueAdmin2024!'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    console.log('Token obtained:', token.substring(0, 50) + '...');
    
    // Now try to create a tenant
    console.log('\n🏢 Testing tenant creation...');
    
    const tenantResponse = await axios.post('http://localhost:5006/api/super-admin/tenants', {
      name: 'Test Tenant Debug',
      adminUser: {
        name: 'Test Admin',
        email: 'testadmin@debug.com',
        password: 'TestPass123!'
      },
      subscriptionPackageId: null // Let it use default
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Tenant creation successful:', tenantResponse.data);
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.status, error.response?.statusText);
    console.log('Error details:', error.response?.data);
    console.log('Full error:', error.message);
  }
}

testSuperAdminLogin();