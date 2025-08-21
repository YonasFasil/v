const { neon } = require('@neondatabase/serverless');

module.exports = async function handler(req, res) {
  // Set CORS headers
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
    
    if (req.method === 'GET') {
      // Get all packages
      const packages = await sql`
        SELECT * FROM packages 
        ORDER BY created_at DESC
      `;
      
      res.json(packages);
      
    } else if (req.method === 'POST') {
      // Create new package
      const { 
        name, 
        description, 
        category, 
        price, 
        pricingModel = 'fixed',
        applicableSpaceIds = [],
        includedServiceIds = [],
        enabledTaxIds = [],
        isActive = true,
        tenantId 
      } = req.body;
      
      if (!name || !category || !price) {
        return res.status(400).json({ 
          message: 'Name, category, and price are required' 
        });
      }
      
      const newPackage = await sql`
        INSERT INTO packages (
          name, description, category, price, pricing_model,
          applicable_space_ids, included_service_ids, enabled_tax_ids,
          is_active, tenant_id, created_at, updated_at
        ) VALUES (
          ${name}, ${description}, ${category}, ${price}, ${pricingModel},
          ${applicableSpaceIds}, ${includedServiceIds}, ${enabledTaxIds},
          ${isActive}, ${tenantId}, NOW(), NOW()
        )
        RETURNING *
      `;
      
      res.status(201).json(newPackage[0]);
      
    } else if (req.method === 'PUT') {
      // Update package
      const { id } = req.query;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({ message: 'Package ID is required' });
      }
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id') {
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${snakeKey} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }
      
      updateFields.push('updated_at = NOW()');
      values.push(id);
      
      const query = `
        UPDATE packages 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const updatedPackage = await sql.query(query, values);
      
      if (updatedPackage.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json(updatedPackage.rows[0]);
      
    } else if (req.method === 'DELETE') {
      // Delete package
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Package ID is required' });
      }
      
      const deletedPackage = await sql`
        DELETE FROM packages 
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (deletedPackage.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json({ message: 'Package deleted successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Packages API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
};