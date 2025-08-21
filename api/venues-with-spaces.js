const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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
    
    // Get venues with their spaces
    const venues = await sql`
      SELECT 
        v.*,
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN s.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', s.id,
                  'name', s.name,
                  'description', s.description,
                  'capacity', s.capacity,
                  'spaceType', s.space_type,
                  'amenities', s.amenities,
                  'availableSetupStyles', s.available_setup_styles,
                  'features', s.features,
                  'isActive', s.is_active
                )
              ELSE NULL
            END
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as spaces
      FROM venues v
      LEFT JOIN spaces s ON v.id = s.venue_id AND s.is_active = true
      WHERE v.tenant_id = ${tenantId} AND v.is_active = true
      GROUP BY v.id
      ORDER BY v.created_at DESC
    `;
    
    res.json(venues);
    
  } catch (error) {
    console.error('Venues with spaces API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};