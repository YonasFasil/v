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
      // Get all venues for this tenant
      const venues = await sql`
        SELECT * FROM venues 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      
      res.json(venues);
      
    } else if (req.method === 'POST') {
      // Create new venue
      const { name, description, location, contact_info, amenities, policies } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Venue name is required' });
      }
      
      const newVenue = await sql`
        INSERT INTO venues (
          tenant_id, name, description, location, contact_info, 
          amenities, policies, is_active, created_at
        ) VALUES (
          ${tenantId}, ${name}, ${description || null}, ${location || null}, 
          ${contact_info || null}, ${amenities || null}, ${policies || null}, 
          true, NOW()
        )
        RETURNING *
      `;
      
      res.status(201).json(newVenue[0]);
      
    } else if (req.method === 'PUT') {
      // Update venue
      const { id } = req.query;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'Venue ID is required' });
      }
      
      const updatedVenue = await sql`
        UPDATE venues 
        SET name = COALESCE(${updates.name}, name),
            description = COALESCE(${updates.description}, description),
            location = COALESCE(${updates.location}, location),
            contact_info = COALESCE(${updates.contact_info}, contact_info),
            amenities = COALESCE(${updates.amenities}, amenities),
            policies = COALESCE(${updates.policies}, policies),
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING *
      `;
      
      if (updatedVenue.length === 0) {
        return res.status(404).json({ message: 'Venue not found' });
      }
      
      res.json(updatedVenue[0]);
      
    } else if (req.method === 'DELETE') {
      // Deactivate venue
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Venue ID is required' });
      }
      
      const deactivatedVenue = await sql`
        UPDATE venues 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING *
      `;
      
      if (deactivatedVenue.length === 0) {
        return res.status(404).json({ message: 'Venue not found' });
      }
      
      res.json({ message: 'Venue deactivated successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Venues API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};