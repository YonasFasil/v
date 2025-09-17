const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_zRXKQ7WHkJ5f@ep-quiet-waterfall-ad02xgr6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function checkBookingsColumns() {
  try {
    console.log('Checking bookings table structure...');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position;
    `);

    console.log('\nBookings table columns:');
    result.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Test a simple status update without updated_at
    console.log('\n--- Testing simple status update (without updated_at) ---');

    const bookingResult = await pool.query(`
      SELECT id, status FROM bookings WHERE contract_id IS NULL LIMIT 1
    `);

    if (bookingResult.rows.length > 0) {
      const booking = bookingResult.rows[0];
      const newStatus = booking.status === 'inquiry' ? 'confirmed' : 'inquiry';

      console.log(`Updating booking ${booking.id} from ${booking.status} to ${newStatus}`);

      const updateResult = await pool.query(`
        UPDATE bookings
        SET status = $1
        WHERE id = $2
        RETURNING id, status, created_at
      `, [newStatus, booking.id]);

      console.log('Update successful:', updateResult.rows[0]);

      // Revert back
      await pool.query(`
        UPDATE bookings SET status = $1 WHERE id = $2
      `, [booking.status, booking.id]);

      console.log('Reverted status back to original');
    }

  } catch (error) {
    console.error('Error checking bookings columns:', error);
  } finally {
    await pool.end();
  }
}

checkBookingsColumns();