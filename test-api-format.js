const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function testAPIFormat() {
  try {
    console.log('🌐 Testing API data format (what frontend expects)...\n');

    // Test bookings API format
    console.log('1. Testing bookings data structure:');
    const bookings = await sql`
      SELECT
        b.id,
        b.event_name,
        b.event_date,
        b.status,
        b.guest_count,
        b.total_amount,
        b.contract_id,
        c.name as customer_name,
        c.email as customer_email,
        v.name as venue_name,
        s.name as space_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      LEFT JOIN spaces s ON b.space_id = s.id
      ORDER BY b.created_at DESC
      LIMIT 3
    `;

    console.log(`Retrieved ${bookings.length} sample bookings:`);
    bookings.forEach((booking, i) => {
      console.log(`${i+1}. Event: "${booking.event_name}"`);
      console.log(`   Customer: "${booking.customer_name}" (${booking.customer_email})`);
      console.log(`   Venue: "${booking.venue_name}"`);
      console.log(`   Space: "${booking.space_name}"`);
      console.log(`   Date: ${booking.event_date}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Guests: ${booking.guest_count}`);
      console.log(`   Amount: $${booking.total_amount}`);
      console.log(`   Contract: ${booking.contract_id ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Test contract grouping
    console.log('2. Testing contract data structure:');
    const contracts = await sql`
      SELECT
        c.id as contract_id,
        c.contract_name,
        c.status as contract_status,
        COUNT(b.id) as event_count,
        array_agg(b.event_name) as event_names,
        array_agg(b.event_date ORDER BY b.event_date) as event_dates
      FROM contracts c
      LEFT JOIN bookings b ON c.id = b.contract_id
      GROUP BY c.id, c.contract_name, c.status
      HAVING COUNT(b.id) > 0
      ORDER BY event_count DESC
      LIMIT 3
    `;

    console.log(`Found ${contracts.length} contracts with events:`);
    contracts.forEach((contract, i) => {
      console.log(`${i+1}. Contract: "${contract.contract_name}"`);
      console.log(`   Status: ${contract.contract_status}`);
      console.log(`   Events: ${contract.event_count}`);
      console.log(`   Dates: ${contract.event_dates.slice(0, 3).map(d => new Date(d).toDateString()).join(', ')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ API format test error:', error.message);
  }
}

testAPIFormat();