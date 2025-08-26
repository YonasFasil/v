const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testApiEndpoints() {
  console.log('🔍 Testing API endpoints to simulate the login and spaces issue...\n');
  
  const baseUrl = 'http://localhost:5006';
  
  try {
    console.log('1️⃣ Testing login with super admin credentials:');
    
    // Try to login as super admin
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@yourdomain.com',
        password: 'VenueAdmin2024!'
      })
    });
    
    if (!loginResponse.ok) {
      console.log(`❌ Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      const errorText = await loginResponse.text();
      console.log(`Error: ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`User: ${loginData.user?.name} (${loginData.user?.email})`);
    console.log(`Role: ${loginData.user?.role}`);
    console.log(`Tenant: ${loginData.user?.tenantId}`);
    
    const token = loginData.token;
    
    if (!token) {
      console.log('❌ No token received from login');
      return;
    }
    
    console.log('\n2️⃣ Testing spaces fetch with proper authentication:');
    
    // Test fetching spaces with auth header
    const spacesResponse = await fetch(`${baseUrl}/api/spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!spacesResponse.ok) {
      console.log(`❌ Spaces fetch failed: ${spacesResponse.status} ${spacesResponse.statusText}`);
      const errorText = await spacesResponse.text();
      console.log(`Error: ${errorText}`);
    } else {
      const spacesData = await spacesResponse.json();
      console.log(`✅ Spaces fetch successful: ${spacesData.length} spaces found`);
      spacesData.forEach((space, index) => {
        console.log(`   ${index + 1}. ${space.name} (Venue: ${space.venueId})`);
      });
    }
    
    console.log('\n3️⃣ Testing spaces fetch WITHOUT authentication (simulating your bug):');
    
    // Test fetching spaces without auth header
    const noAuthResponse = await fetch(`${baseUrl}/api/spaces`);
    
    if (!noAuthResponse.ok) {
      console.log(`❌ No-auth fetch failed: ${noAuthResponse.status} ${noAuthResponse.statusText}`);
      const errorText = await noAuthResponse.text();
      console.log(`Error: ${errorText}`);
    } else {
      const noAuthData = await noAuthResponse.json();
      console.log(`⚠️  No-auth fetch returned: ${noAuthData.length} spaces`);
      if (noAuthData.length === 0) {
        console.log('🎯 THIS IS YOUR ISSUE: Without auth, API returns empty array!');
      }
    }
    
    console.log('\n4️⃣ Testing venue creation with authentication:');
    
    // Test creating a venue first (needed for spaces)
    const venueResponse = await fetch(`${baseUrl}/api/venues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'API Test Venue',
        description: 'A venue created for API testing',
        capacity: 100,
        pricePerHour: 50.00,
        amenities: ['WiFi', 'Parking']
      })
    });
    
    if (!venueResponse.ok) {
      console.log(`❌ Venue creation failed: ${venueResponse.status} ${venueResponse.statusText}`);
      const errorText = await venueResponse.text();
      console.log(`Error: ${errorText}`);
    } else {
      const venueData = await venueResponse.json();
      console.log(`✅ Venue created: ${venueData.name} (ID: ${venueData.id})`);
      
      console.log('\n5️⃣ Testing space creation with authentication:');
      
      // Now test creating a space
      const spaceResponse = await fetch(`${baseUrl}/api/spaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venueId: venueData.id,
          name: 'API Test Space',
          description: 'A space created for API testing',
          capacity: 50,
          pricePerHour: 25.00,
          amenities: ['Projector', 'Whiteboard']
        })
      });
      
      if (!spaceResponse.ok) {
        console.log(`❌ Space creation failed: ${spaceResponse.status} ${spaceResponse.statusText}`);
        const errorText = await spaceResponse.text();
        console.log(`Error: ${errorText}`);
      } else {
        const spaceData = await spaceResponse.json();
        console.log(`✅ Space created: ${spaceData.name} (ID: ${spaceData.id})`);
        
        console.log('\n6️⃣ Testing spaces fetch after creation:');
        
        // Fetch spaces again to see if the new space appears
        const updatedSpacesResponse = await fetch(`${baseUrl}/api/spaces`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (updatedSpacesResponse.ok) {
          const updatedSpacesData = await updatedSpacesResponse.json();
          console.log(`✅ Updated spaces fetch: ${updatedSpacesData.length} spaces found`);
          const newSpace = updatedSpacesData.find(s => s.id === spaceData.id);
          if (newSpace) {
            console.log('✅ Newly created space appears in the list!');
          } else {
            console.log('❌ Newly created space DOES NOT appear in the list!');
          }
        }
        
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await fetch(`${baseUrl}/api/spaces/${spaceData.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        await fetch(`${baseUrl}/api/venues/${venueData.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Test data cleaned up');
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('If spaces don\'t appear in your frontend, check:');
    console.log('1. Is your frontend including the Authorization header?');
    console.log('2. Is the token valid and not expired?');
    console.log('3. Are you calling the right API endpoint?');
    console.log('4. Is your state management updating after creation?');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server is not running. Please start it with:');
      console.log('   npm run dev');
      console.log('   or');
      console.log('   set NODE_ENV=development && npx tsx server/index.ts');
    }
  }
}

testApiEndpoints();