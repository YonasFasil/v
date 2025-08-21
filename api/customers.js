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
      // Get all customers for this tenant
      const customers = await sql`
        SELECT * FROM customers 
        WHERE tenant_id = ${tenantId}
        ORDER BY created_at DESC
      `;
      
      res.json(customers);
      
    } else if (req.method === 'POST') {
      // Create new customer
      const { name, email, phone, company, notes } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }
      
      const newCustomer = await sql`
        INSERT INTO customers (
          tenant_id, name, email, phone, company, notes, 
          is_active, created_at
        ) VALUES (
          ${tenantId}, ${name}, ${email}, ${phone || null}, 
          ${company || null}, ${notes || null}, true, NOW()
        )
        RETURNING *
      `;
      
      res.status(201).json(newCustomer[0]);
      
    } else if (req.method === 'PUT') {
      // Update customer
      const { id } = req.query;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'Customer ID is required' });
      }
      
      const updatedCustomer = await sql`
        UPDATE customers 
        SET name = COALESCE(${updates.name}, name),
            email = COALESCE(${updates.email}, email),
            phone = COALESCE(${updates.phone}, phone),
            company = COALESCE(${updates.company}, company),
            notes = COALESCE(${updates.notes}, notes),
            updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING *
      `;
      
      if (updatedCustomer.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json(updatedCustomer[0]);
      
    } else if (req.method === 'DELETE') {
      // Deactivate customer
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Customer ID is required' });
      }
      
      const deactivatedCustomer = await sql`
        UPDATE customers 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING *
      `;
      
      if (deactivatedCustomer.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      res.json({ message: 'Customer deactivated successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Customers API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};