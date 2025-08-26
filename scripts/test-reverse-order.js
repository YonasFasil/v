const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testReverseOrder() {
  console.log('🔄 Testing endpoints in REVERSE order...\\n');
  
  const baseUrl = 'http://localhost:5006';
  
  try {
    console.log('1️⃣ Login as tenant admin:');
    
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'yonasfasinnl.sl@gmail.com',
        password: 'VenueAdmin2024!'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log(`❌ Login failed: ${errorText}`);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log(`✅ Login successful: ${loginData.user.name}`);
    console.log(`   Tenant: ${loginData.user.tenantId}`);
    
    const token = loginData.token;
    
    console.log('\\n2️⃣ Testing /api/venues-with-spaces FIRST:');
    
    const venuesResponse = await fetch(`${baseUrl}/api/venues-with-spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (venuesResponse.ok) {
      const venuesData = await venuesResponse.json();
      console.log(`✅ /api/venues-with-spaces: ${venuesData.length} venues found`);
      let totalSpaces = 0;
      venuesData.forEach((venue, idx) => {
        const spaceCount = venue.spaces?.length || 0;
        totalSpaces += spaceCount;
        console.log(`   ${idx + 1}. Venue "${venue.name}": ${spaceCount} spaces`);
      });
      console.log(`   📊 Total spaces: ${totalSpaces}`);
    } else {
      console.log(`❌ /api/venues-with-spaces failed: ${venuesResponse.status}`);
    }
    
    console.log('\\n3️⃣ Testing /api/spaces SECOND:');
    
    const spacesResponse = await fetch(`${baseUrl}/api/spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (spacesResponse.ok) {
      const spacesData = await spacesResponse.json();
      console.log(`✅ /api/spaces: ${spacesData.length} spaces found`);
    } else {
      console.log(`❌ /api/spaces failed: ${spacesResponse.status}`);
    }
    
    console.log('\\n🔄 REVERSE ORDER RESULT:');
    console.log('If venues-with-spaces works when called first, there is a context bleeding issue.');
    console.log('If it still fails, the issue is in the endpoint itself.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReverseOrder();