// Quick test to check if conflicts are working
const testSpaceIds = ['test-space-1', 'test-space-2'];
const testDate = '2025-09-25';
const testStartTime = '09:00 AM';
const testEndTime = '17:00 PM';

const apiUrl = 'http://localhost:3050/api/bookings/check-conflicts';

const payload = {
  spaceIds: testSpaceIds,
  eventDate: testDate,
  startTime: testStartTime,
  endTime: testEndTime
};

console.log('Testing conflict detection...');
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