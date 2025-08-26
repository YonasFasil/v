const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Package ID is required' });
    }
    
    if (req.method === 'GET') {
      // Get single package
      const packages = await pool.query(`SELECT * FROM subscription_packages 
        WHERE id = ${id}`);
      
      if (packages.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json(packages.rows[0]);
      
    } else if (req.method === 'PUT') {
      // Update package
      const {
        name,
        description,
        price,
        billingInterval,
        trialDays,
        maxVenues,
        maxUsers,
        maxBookingsPerMonth,
        features,
        isActive,
        sortOrder
      } = req.body;
      
      const updatedPackage = await pool.query(`UPDATE subscription_packages 
        SET 
          name = ${name},
          description = ${description},
          price = ${price},
          billing_interval = ${billingInterval},
          trial_days = ${trialDays},
          max_venues = ${maxVenues},
          max_users = ${maxUsers},
          max_bookings_per_month = ${maxBookingsPerMonth},
          features = ${JSON.stringify(features || [])},
          is_active = ${isActive},
          sort_order = ${sortOrder}
        WHERE id = ${id}
        RETURNING *`);
      
      if (updatedPackage.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json(updatedPackage.rows[0]);
      
    } else if (req.method === 'DELETE') {
      // Delete package
      const deletedPackage = await pool.query(`DELETE FROM subscription_packages 
        WHERE id = ${id}
        RETURNING *`);
      
      if (deletedPackage.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json({ message: 'Package deleted successfully' }.rows);
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Package operation error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    } finally {

    
    if (pool) {

    
      await pool.end();

    
    }

    
  });
  }
};