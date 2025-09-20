// Test creating a booking for today to trigger conflict detection with those 2 existing bookings
const testSpaceIds = ['6a9c43c9-c923-477f-967d-7c5ca27cea76', 'be8e7dd4-c064-4b78-9ebb-f5e4ca96b39c'];
const testDate = '2025-09-20'; // Today, where we saw 2 existing bookings
const testStartTime = '09:00 AM';
const testEndTime = '05:00 PM';

const apiUrl = 'http://localhost:3050/api/bookings/check-conflicts';

const payload = {
  spaceIds: testSpaceIds,
  eventDate: testDate,
  startTime: testStartTime,
  endTime: testEndTime
};

console.log('Testing conflict detection for today with those specific spaces...');
console.log('Payload:', JSON.stringify(payload, null, 2));

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // You'll need to add auth headers if required
  },
  body: JSON.stringify(payload)
})
.then(response => response.json())
.then(data => {
  console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('Error:', error);
});