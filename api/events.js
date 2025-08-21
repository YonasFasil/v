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
      // Get all events for this tenant
      const events = await sql`
        SELECT e.*, 
               c.name as customer_name,
               v.name as venue_name,
               s.name as space_name
        FROM events e
        LEFT JOIN customers c ON e.customer_id = c.id
        LEFT JOIN venues v ON e.venue_id = v.id
        LEFT JOIN spaces s ON e.space_id = s.id
        WHERE e.tenant_id = ${tenantId}
        ORDER BY e.start_date DESC
      `;
      
      res.json(events);
      
    } else if (req.method === 'POST') {
      // Create new event
      const { 
        customer_id, venue_id, space_id, title, description,
        start_date, end_date, start_time, end_time, 
        event_type, status, estimated_guests, actual_guests,
        setup_style, special_requirements, catering_notes
      } = req.body;
      
      if (!title || !start_date || !customer_id) {
        return res.status(400).json({ message: 'Title, start date, and customer are required' });
      }
      
      const newEvent = await sql`
        INSERT INTO events (
          tenant_id, customer_id, venue_id, space_id, title, description,
          start_date, end_date, start_time, end_time, event_type, status,
          estimated_guests, actual_guests, setup_style, special_requirements,
          catering_notes, created_at
        ) VALUES (
          ${tenantId}, ${customer_id}, ${venue_id || null}, ${space_id || null},
          ${title}, ${description || null}, ${start_date}, ${end_date || null},
          ${start_time || null}, ${end_time || null}, ${event_type || 'event'},
          ${status || 'inquiry'}, ${estimated_guests || null}, ${actual_guests || null},
          ${setup_style || null}, ${special_requirements || null}, 
          ${catering_notes || null}, NOW()
        )
        RETURNING *
      `;
      
      res.status(201).json(newEvent[0]);
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Events API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};