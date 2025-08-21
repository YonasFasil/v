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
      // Get all subscription packages
      const packages = await sql`
        SELECT * FROM subscription_packages 
        ORDER BY created_at DESC
      `;
      
      res.json(packages);
      
    } else if (req.method === 'POST') {
      // Create new subscription package
      const { 
        name, 
        description, 
        price, 
        billingInterval = 'monthly',
        trialDays = 14,
        maxVenues = 1,
        maxUsers = 3,
        maxBookingsPerMonth = 100,
        features = [],
        isActive = true,
        sortOrder = 0
      } = req.body;
      
      if (!name || !price) {
        return res.status(400).json({ 
          message: 'Name and price are required' 
        });
      }
      
      const newPackage = await sql`
        INSERT INTO subscription_packages (
          name, description, price, billing_interval, trial_days,
          max_venues, max_users, max_bookings_per_month,
          features, is_active, sort_order, created_at
        ) VALUES (
          ${name}, ${description}, ${price}, ${billingInterval}, ${trialDays},
          ${maxVenues}, ${maxUsers}, ${maxBookingsPerMonth},
          ${JSON.stringify(features)}, ${isActive}, ${sortOrder}, NOW()
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
        UPDATE subscription_packages 
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
        DELETE FROM subscription_packages 
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