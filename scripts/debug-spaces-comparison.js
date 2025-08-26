const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function debugSpacesComparison() {
  console.log('🔍 Comparing /api/spaces vs /api/venues-with-spaces...\\n');
  
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
    
    console.log('\\n2️⃣ Testing /api/spaces:');
    
    const spacesResponse = await fetch(`${baseUrl}/api/spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (spacesResponse.ok) {
      const spacesData = await spacesResponse.json();
      console.log(`✅ /api/spaces: ${spacesData.length} spaces found`);
      spacesData.forEach((space, idx) => {
        console.log(`   ${idx + 1}. "${space.name}" (venueId: ${space.venueId})`);
      });
    } else {
      console.log(`❌ /api/spaces failed: ${spacesResponse.status}`);
    }
    
    console.log('\\n3️⃣ Testing /api/venues-with-spaces:');
    
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
        console.log(`   ${idx + 1}. Venue "${venue.name}" (${venue.id}): ${spaceCount} spaces`);
        if (venue.spaces && venue.spaces.length > 0) {
          venue.spaces.forEach((space, spaceIdx) => {
            console.log(`      ${spaceIdx + 1}. "${space.name}"`);
          });
        }
      });
      console.log(`   📊 Total spaces: ${totalSpaces}`);
    } else {
      console.log(`❌ /api/venues-with-spaces failed: ${venuesResponse.status}`);
    }
    
    console.log('\\n🔍 COMPARISON:');
    console.log('If /api/spaces shows spaces but /api/venues-with-spaces shows 0, the issue is in venues-with-spaces endpoint');
    console.log('If both show the same spaces, the issue is elsewhere');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugSpacesComparison();