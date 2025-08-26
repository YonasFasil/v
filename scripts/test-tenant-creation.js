const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testTenantCreation() {
  console.log('🏢 Testing tenant creation endpoint...\n');
  
  const baseUrl = 'http://localhost:5010';
  
  try {
    // First, we need to login as super admin
    console.log('1️⃣ Attempting super admin login:');
    const superAdminLogin = await fetch(`${baseUrl}/api/super-admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'superadmin',
        password: 'SuperSecure123!'
      })
    });
    
    if (!superAdminLogin.ok) {
      console.log('❌ Super admin login failed. Testing with regular admin...');
      
      // Try with regular admin login
      console.log('2️⃣ Trying regular admin login:');
      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'yonasfasinnl.sl@gmail.com',
          password: 'VenueAdmin2024!'
        })
      });
      
      if (!adminLogin.ok) {
        console.log('❌ Admin login also failed');
        return;
      }
      
      const adminData = await adminLogin.json();
      console.log(`✅ Admin login successful: ${adminData.user.name}`);
      
      // Try to create tenant via public signup (this should work)
      console.log('\n3️⃣ Testing public tenant signup:');
      const signupResponse = await fetch(`${baseUrl}/api/public/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'Test Tenant ' + Date.now(),
          fullName: 'Test User',
          email: 'test' + Date.now() + '@example.com',
          password: 'TestPassword123!',
          packageId: '9f9f6bdd-ed9f-4a99-9342-d11b35d662cf', // Enterprise package
          agreeToTerms: true
        })
      });
      
      if (signupResponse.ok) {
        const signupData = await signupResponse.json();
        console.log('✅ Public signup successful!');
        console.log(`   Tenant: ${signupData.tenant?.name || 'Unknown'}`);
      } else {
        const errorText = await signupResponse.text();
        console.log(`❌ Public signup failed: ${signupResponse.status}`);
        console.log(`   Error: ${errorText}`);
        
        // Check if it's the SQL syntax error
        if (errorText.includes('syntax error at or near "$1"')) {
          console.log('\n🚨 CONFIRMED: SQL syntax error in tenant creation!');
          console.log('   This is the same $1 parameter binding issue we fixed elsewhere.');
        }
      }
      
    } else {
      const superAdminData = await superAdminLogin.json();
      console.log(`✅ Super admin login successful`);
      
      // Test super admin tenant creation
      console.log('\n2️⃣ Testing super admin tenant creation:');
      const createTenantResponse = await fetch(`${baseUrl}/api/super-admin/create-tenant`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminData.token}`
        },
        body: JSON.stringify({
          name: 'Super Admin Test Tenant ' + Date.now(),
          email: 'supertest' + Date.now() + '@example.com',
          password: 'TestPassword123!'
        })
      });
      
      if (createTenantResponse.ok) {
        const tenantData = await createTenantResponse.json();
        console.log('✅ Super admin tenant creation successful!');
      } else {
        const errorText = await createTenantResponse.text();
        console.log(`❌ Super admin tenant creation failed: ${createTenantResponse.status}`);
        console.log(`   Error: ${errorText}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTenantCreation();