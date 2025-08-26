const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testSpacesEndpoints() {
  console.log('🔍 Testing spaces API endpoints...\n');
  
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
    
    // Test 1: GET /api/spaces
    console.log('\n2️⃣ Testing GET /api/spaces:');
    const spacesResponse = await fetch(`${baseUrl}/api/spaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (spacesResponse.ok) {
      const spacesData = await spacesResponse.json();
      console.log(`✅ GET /api/spaces: ${spacesData.length} spaces found`);
      if (spacesData.length > 0) {
        spacesData.slice(0, 3).forEach((space, idx) => {
          console.log(`   ${idx + 1}. "${space.name}" (venue: ${space.venueId})`);
        });
        if (spacesData.length > 3) {
          console.log(`   ... and ${spacesData.length - 3} more spaces`);
        }
      } else {
        console.log('   ⚠️  No spaces returned - this might be the issue!');
      }
    } else {
      console.log(`❌ GET /api/spaces failed: ${spacesResponse.status}`);
      console.log(`   Error: ${await spacesResponse.text()}`);
    }
    
    // Test 2: First get venues to find a venue ID
    console.log('\n3️⃣ Getting venues to test venue-specific spaces:');
    const venuesResponse = await fetch(`${baseUrl}/api/venues`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (venuesResponse.ok) {
      const venuesData = await venuesResponse.json();
      console.log(`✅ Found ${venuesData.length} venues`);
      
      if (venuesData.length > 0) {
        const firstVenue = venuesData[0];
        console.log(`   Testing with venue: "${firstVenue.name}" (${firstVenue.id})`);
        
        // Test 3: GET /api/venues/:venueId/spaces
        console.log(`\n4️⃣ Testing GET /api/venues/${firstVenue.id}/spaces:`);
        const venueSpacesResponse = await fetch(`${baseUrl}/api/venues/${firstVenue.id}/spaces`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (venueSpacesResponse.ok) {
          const venueSpacesData = await venueSpacesResponse.json();
          console.log(`✅ GET /api/venues/${firstVenue.id}/spaces: ${venueSpacesData.length} spaces found`);
          if (venueSpacesData.length > 0) {
            venueSpacesData.forEach((space, idx) => {
              console.log(`   ${idx + 1}. "${space.name}" (ID: ${space.id})`);
            });
          } else {
            console.log('   ⚠️  No spaces returned for this venue!');
          }
        } else {
          console.log(`❌ GET /api/venues/${firstVenue.id}/spaces failed: ${venueSpacesResponse.status}`);
          console.log(`   Error: ${await venueSpacesResponse.text()}`);
        }
      } else {
        console.log('   ❌ No venues found to test with');
      }
    } else {
      console.log(`❌ Failed to get venues: ${venuesResponse.status}`);
    }
    
    // Test 4: Compare with the working venues?include=spaces
    console.log('\n5️⃣ Comparing with working /api/venues?include=spaces:');
    const venuesWithSpacesResponse = await fetch(`${baseUrl}/api/venues?include=spaces`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (venuesWithSpacesResponse.ok) {
      const venuesWithSpacesData = await venuesWithSpacesResponse.json();
      let totalSpaces = 0;
      venuesWithSpacesData.forEach(venue => {
        totalSpaces += (venue.spaces?.length || 0);
      });
      console.log(`✅ /api/venues?include=spaces shows ${totalSpaces} total spaces`);
      
      if (totalSpaces > 0) {
        console.log('\n🔍 ANALYSIS:');
        console.log('   - venues?include=spaces shows spaces exist');
        console.log('   - If /api/spaces returns 0, there\'s a tenant filtering issue');
        console.log('   - If /api/venues/:id/spaces returns 0, there\'s a venue-specific filtering issue');
      }
    } else {
      console.log(`❌ venues?include=spaces failed: ${venuesWithSpacesResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSpacesEndpoints();