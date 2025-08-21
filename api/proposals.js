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
      // Get all proposals for this tenant
      const proposals = await sql`
        SELECT p.*, 
               c.name as customer_name,
               e.title as event_title
        FROM proposals p
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN events e ON p.event_id = e.id
        WHERE p.tenant_id = ${tenantId}
        ORDER BY p.created_at DESC
      `;
      
      res.json(proposals);
      
    } else if (req.method === 'POST') {
      // Create new proposal
      const { 
        customer_id, event_id, title, description, items,
        subtotal, tax_amount, total_amount, discount_amount,
        notes, terms_conditions, status, valid_until
      } = req.body;
      
      if (!customer_id || !title) {
        return res.status(400).json({ message: 'Customer and title are required' });
      }
      
      const newProposal = await sql`
        INSERT INTO proposals (
          tenant_id, customer_id, event_id, title, description, items,
          subtotal, tax_amount, total_amount, discount_amount, notes,
          terms_conditions, status, valid_until, created_at
        ) VALUES (
          ${tenantId}, ${customer_id}, ${event_id || null}, ${title},
          ${description || null}, ${items || null}, ${subtotal || 0},
          ${tax_amount || 0}, ${total_amount || 0}, ${discount_amount || 0},
          ${notes || null}, ${terms_conditions || null}, ${status || 'draft'},
          ${valid_until || null}, NOW()
        )
        RETURNING *
      `;
      
      res.status(201).json(newProposal[0]);
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Proposals API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};