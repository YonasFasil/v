// Simple test to check date storage and comparison
const fetch = require('node-fetch');

async function testDates() {
  try {
    console.log('Testing date comparison issue...');

    // First, let's create a booking for today and see what happens
    console.log('1. Checking existing bookings on different dates:');

    // Test multiple date formats
    const testDates = [
      '2025-09-30',
      '2025-09-29',
      '2025-09-20'
    ];

    for (const date of testDates) {
      console.log(`\nTesting date: ${date}`);
      const payload = {
        spaceIds: ['3589e381-9b04-4320-9bd9-e66d66fc7aa1'],
        eventDate: date,
        startTime: '09:00 AM',
        endTime: '05:00 PM'
      };

      // Note: This will fail without auth, but we can see the server logs
      try {
        const response = await fetch('http://localhost:3050/api/bookings/check-conflicts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log(`  Response: ${JSON.stringify(data)}`);
      } catch (error) {
        console.log(`  Expected auth error for ${date}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testDates();