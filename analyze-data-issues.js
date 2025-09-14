const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function analyzeDataIssues() {
  try {
    console.log('🔍 Analyzing data quality issues...\n');

    // 1. Check for missing critical fields in bookings
    console.log('1. Checking bookings data completeness:');
    const bookingIssues = await sql`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN event_name IS NULL OR event_name = '' THEN 1 END) as missing_event_name,
        COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as missing_customer,
        COUNT(CASE WHEN venue_id IS NULL THEN 1 END) as missing_venue,
        COUNT(CASE WHEN event_date IS NULL THEN 1 END) as missing_date,
        COUNT(CASE WHEN status IS NULL OR status = '' THEN 1 END) as missing_status
      FROM bookings
    `;

    const issues = bookingIssues[0];
    console.log(`   Total bookings: ${issues.total_bookings}`);
    if (issues.missing_event_name > 0) console.log(`   ❌ Missing event names: ${issues.missing_event_name}`);
    if (issues.missing_customer > 0) console.log(`   ❌ Missing customers: ${issues.missing_customer}`);
    if (issues.missing_venue > 0) console.log(`   ❌ Missing venues: ${issues.missing_venue}`);
    if (issues.missing_date > 0) console.log(`   ❌ Missing dates: ${issues.missing_date}`);
    if (issues.missing_status > 0) console.log(`   ❌ Missing status: ${issues.missing_status}`);

    // 2. Check for broken foreign key relationships
    console.log('\n2. Checking relationship integrity:');
    const brokenCustomers = await sql`
      SELECT COUNT(*) as count FROM bookings b
      WHERE b.customer_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = b.customer_id)
    `;

    const brokenVenues = await sql`
      SELECT COUNT(*) as count FROM bookings b
      WHERE b.venue_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM venues v WHERE v.id = b.venue_id)
    `;

    const brokenSpaces = await sql`
      SELECT COUNT(*) as count FROM bookings b
      WHERE b.space_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM spaces s WHERE s.id = b.space_id)
    `;

    if (brokenCustomers[0].count > 0) console.log(`   ❌ Bookings with missing customers: ${brokenCustomers[0].count}`);
    if (brokenVenues[0].count > 0) console.log(`   ❌ Bookings with missing venues: ${brokenVenues[0].count}`);
    if (brokenSpaces[0].count > 0) console.log(`   ❌ Bookings with missing spaces: ${brokenSpaces[0].count}`);

    // 3. Sample problematic data
    console.log('\n3. Sample bookings with potential display issues:');
    const problemBookings = await sql`
      SELECT
        b.id,
        b.event_name,
        b.event_date,
        b.status,
        b.customer_id,
        c.name as customer_name,
        b.venue_id,
        v.name as venue_name,
        b.total_amount
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      LEFT JOIN venues v ON b.venue_id = v.id
      WHERE
        b.event_name IS NULL OR b.event_name = '' OR
        c.name IS NULL OR
        v.name IS NULL
      ORDER BY b.created_at DESC
      LIMIT 5
    `;

    if (problemBookings.length > 0) {
      problemBookings.forEach((booking, i) => {
        console.log(`   ${i+1}. Booking ID: ${booking.id.slice(-8)}`);
        console.log(`      Event: "${booking.event_name || 'MISSING'}"`);
        console.log(`      Customer: "${booking.customer_name || 'MISSING'}"`);
        console.log(`      Venue: "${booking.venue_name || 'MISSING'}"`);
        console.log(`      Date: ${booking.event_date || 'MISSING'}`);
        console.log(`      Amount: $${booking.total_amount || '0'}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No obvious data issues found');
    }

    // 4. Check contract data
    console.log('4. Checking contract/multi-date event data:');
    const contractIssues = await sql`
      SELECT
        COUNT(*) as total_contracts,
        COUNT(CASE WHEN contract_name IS NULL OR contract_name = '' THEN 1 END) as missing_names
      FROM contracts
    `;

    const contractBookings = await sql`
      SELECT
        COUNT(*) as bookings_with_contracts,
        COUNT(CASE WHEN contract_id IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM contracts c WHERE c.id = contract_id
        ) THEN 1 END) as broken_contract_links
      FROM bookings
      WHERE contract_id IS NOT NULL
    `;

    console.log(`   Total contracts: ${contractIssues[0].total_contracts}`);
    console.log(`   Bookings in contracts: ${contractBookings[0].bookings_with_contracts}`);
    if (contractIssues[0].missing_names > 0) console.log(`   ❌ Contracts with missing names: ${contractIssues[0].missing_names}`);
    if (contractBookings[0].broken_contract_links > 0) console.log(`   ❌ Broken contract links: ${contractBookings[0].broken_contract_links}`);

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  }
}

analyzeDataIssues();