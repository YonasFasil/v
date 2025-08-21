const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Extract tenant ID from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const jwt = require('jsonwebtoken');
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    const tenantId = decoded.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'No tenant access' });
    }
    
    if (req.method === 'GET') {
      // Get all bookings for this tenant
      const bookings = await sql`
        SELECT b.*, 
               c.name as customer_name,
               e.title as event_title,
               v.name as venue_name,
               s.name as space_name
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.id
        LEFT JOIN events e ON b.event_id = e.id
        LEFT JOIN venues v ON b.venue_id = v.id
        LEFT JOIN spaces s ON b.space_id = s.id
        WHERE b.tenant_id = ${tenantId}
        ORDER BY b.booking_date DESC
      `;
      
      res.json(bookings);
      
    } else if (req.method === 'POST') {
      // Create new booking
      const { 
        customer_id, event_id, venue_id, space_id, booking_date,
        start_time, end_time, status, total_amount, deposit_amount,
        payment_status, notes, cancellation_policy
      } = req.body;
      
      if (!customer_id || !booking_date) {
        return res.status(400).json({ message: 'Customer and booking date are required' });
      }
      
      const newBooking = await sql`
        INSERT INTO bookings (
          tenant_id, customer_id, event_id, venue_id, space_id,
          booking_date, start_time, end_time, status, total_amount,
          deposit_amount, payment_status, notes, cancellation_policy,
          created_at
        ) VALUES (
          ${tenantId}, ${customer_id}, ${event_id || null}, ${venue_id || null},
          ${space_id || null}, ${booking_date}, ${start_time || null},
          ${end_time || null}, ${status || 'pending'}, ${total_amount || 0},
          ${deposit_amount || 0}, ${payment_status || 'unpaid'}, 
          ${notes || null}, ${cancellation_policy || null}, NOW()
        )
        RETURNING *
      `;
      
      res.status(201).json(newBooking[0]);
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Bookings API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};