const { default: fetch } = require('node-fetch');
require('dotenv').config({ path: '../.env' });

async function testVenuesWithSpaces() {
  console.log('🔍 Testing /api/venues-with-spaces endpoint (what your frontend actually uses)...\n');
  
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
    console.log(`✅ Login successful: ${loginData.user.name} (${loginData.user.email})`);
    
    const token = loginData.token;
    
    console.log('\n2️⃣ Testing /api/venues-with-spaces WITH auth (what your frontend should do):');
    
    const venuesWithSpacesAuth = await fetch(`${baseUrl}/api/venues-with-spaces`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${venuesWithSpacesAuth.status}`);
    
    if (!venuesWithSpacesAuth.ok) {
      const errorText = await venuesWithSpacesAuth.text();
      console.log(`❌ Failed: ${errorText}`);
    } else {
      const venuesData = await venuesWithSpacesAuth.json();
      console.log(`✅ Success: ${venuesData.length} venues found`);
      
      venuesData.forEach((venue, index) => {
        console.log(`   ${index + 1}. Venue: "${venue.name}" with ${venue.spaces?.length || 0} spaces`);
        if (venue.spaces && venue.spaces.length > 0) {
          venue.spaces.forEach((space, spaceIndex) => {
            console.log(`      ${spaceIndex + 1}. Space: "${space.name}"`);
          });
        }
      });
    }
    
    console.log('\n3️⃣ Testing /api/venues-with-spaces WITHOUT auth (to see if this is the issue):');
    
    const venuesWithoutAuth = await fetch(`${baseUrl}/api/venues-with-spaces`);
    
    console.log(`Status without auth: ${venuesWithoutAuth.status}`);
    
    if (!venuesWithoutAuth.ok) {
      const errorText = await venuesWithoutAuth.text();
      console.log(`❌ Without auth failed: ${errorText}`);
      console.log('🎯 This means your frontend token is missing or invalid!');
    } else {
      const noAuthData = await venuesWithoutAuth.json();
      console.log(`⚠️  Without auth succeeded: ${noAuthData.length} venues`);
      if (noAuthData.length === 0 || !noAuthData[0].spaces || noAuthData[0].spaces.length === 0) {
        console.log('🎯 This is your bug - no auth returns empty spaces!');
      }
    }
    
    console.log('\n4️⃣ Quick space creation test:');
    
    // Get the first venue
    if (venuesData && venuesData.length > 0) {
      const firstVenue = venuesData[0];
      console.log(`Using venue: ${firstVenue.name} (${firstVenue.id})`);
      
      const createSpaceResponse = await fetch(`${baseUrl}/api/spaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          venueId: firstVenue.id,
          name: 'Frontend Debug Space',
          description: 'Testing if spaces show up after creation',
          capacity: 25,
          pricePerHour: 15.00,
          amenities: ['WiFi']
        })
      });
      
      if (createSpaceResponse.ok) {
        const newSpace = await createSpaceResponse.json();
        console.log(`✅ Space created: ${newSpace.name} (${newSpace.id})`);
        
        console.log('\n5️⃣ Re-fetching venues-with-spaces to see if new space appears:');
        
        const updatedVenues = await fetch(`${baseUrl}/api/venues-with-spaces`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (updatedVenues.ok) {
          const updatedData = await updatedVenues.json();
          const updatedVenue = updatedData.find(v => v.id === firstVenue.id);
          
          if (updatedVenue) {
            console.log(`Updated venue "${updatedVenue.name}" now has ${updatedVenue.spaces?.length || 0} spaces:`);
            updatedVenue.spaces?.forEach((space, idx) => {
              const isNew = space.id === newSpace.id ? ' [JUST CREATED]' : '';
              console.log(`   ${idx + 1}. ${space.name}${isNew}`);
            });
            
            const foundNewSpace = updatedVenue.spaces?.find(s => s.id === newSpace.id);
            if (foundNewSpace) {
              console.log('🎉 SUCCESS: New space appears immediately in venues-with-spaces!');
            } else {
              console.log('❌ PROBLEM: New space does NOT appear in venues-with-spaces!');
            }
          }
        }
        
        // Cleanup
        await fetch(`${baseUrl}/api/spaces/${newSpace.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('🧹 Cleanup complete');
        
      } else {
        console.log('❌ Space creation failed');
      }
    }
    
    console.log('\n🎯 FINAL DIAGNOSIS:');
    console.log('If the API test above works but your frontend doesn\'t show spaces:');
    console.log('1. ❓ Check browser DevTools → Application → Local Storage');
    console.log('2. ❓ Verify auth_token or super_admin_token exists and is valid');
    console.log('3. ❓ Check browser DevTools → Network tab for /api/venues-with-spaces request');
    console.log('4. ❓ Verify Authorization header is present in the request');
    console.log('5. ❓ Check if the response returns venues but with empty spaces arrays');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server not running - please start it first');
    }
  }
}

testVenuesWithSpaces();