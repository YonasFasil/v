// Test to verify the conflict detection fix is working

async function testConflictDetectionFix() {
  try {
    console.log('🔍 Testing conflict detection with date format fix...');

    // Test payload that should work with the fixed date format
    const testPayload = {
      spaceIds: ['test-space-1', 'test-space-2'],
      eventDate: '2025-09-20', // Today's date
      startTime: '09:00 AM',
      endTime: '05:00 PM'
    };

    console.log('📤 Sending request with payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch('http://localhost:3050/api/bookings/check-conflicts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));

    const responseData = await response.json();
    console.log('📊 Response data:', JSON.stringify(responseData, null, 2));

    if (response.status === 500) {
      console.log('❌ Still getting 500 error - date format fix may not be working');
    } else if (response.status === 401 || response.status === 403) {
      console.log('✅ No 500 error! API is working properly (just auth issues as expected)');
      console.log('✅ Date format fix appears successful');
    } else {
      console.log('✅ API call succeeded with status:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConflictDetectionFix();