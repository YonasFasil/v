const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    
    // Test database connectivity and tenant isolation
    const debug = {
      tenantId,
      userInfo: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      },
      tables: {}
    };
    
    try {
      // Test customers table
      const customers = await sql`SELECT COUNT(*) as count FROM customers WHERE tenant_id = ${tenantId}`;
      debug.tables.customers = { count: customers[0].count, status: 'success' };
    } catch (error) {
      debug.tables.customers = { error: error.message, status: 'failed' };
    }
    
    try {
      // Test venues table
      const venues = await sql`SELECT COUNT(*) as count FROM venues WHERE tenant_id = ${tenantId}`;
      debug.tables.venues = { count: venues[0].count, status: 'success' };
    } catch (error) {
      debug.tables.venues = { error: error.message, status: 'failed' };
    }
    
    try {
      // Test events table
      const events = await sql`SELECT COUNT(*) as count FROM events WHERE tenant_id = ${tenantId}`;
      debug.tables.events = { count: events[0].count, status: 'success' };
    } catch (error) {
      debug.tables.events = { error: error.message, status: 'failed' };
    }
    
    try {
      // Test proposals table
      const proposals = await sql`SELECT COUNT(*) as count FROM proposals WHERE tenant_id = ${tenantId}`;
      debug.tables.proposals = { count: proposals[0].count, status: 'success' };
    } catch (error) {
      debug.tables.proposals = { error: error.message, status: 'failed' };
    }
    
    try {
      // Test bookings table
      const bookings = await sql`SELECT COUNT(*) as count FROM bookings WHERE tenant_id = ${tenantId}`;
      debug.tables.bookings = { count: bookings[0].count, status: 'success' };
    } catch (error) {
      debug.tables.bookings = { error: error.message, status: 'failed' };
    }
    
    // Test table structure
    try {
      const tableInfo = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      debug.availableTables = tableInfo.map(t => t.table_name);
    } catch (error) {
      debug.availableTables = { error: error.message };
    }
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      debug
    });
    
  } catch (error) {
    console.error('Debug tenant API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};