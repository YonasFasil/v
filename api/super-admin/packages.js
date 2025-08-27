const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  let pool;
  
  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    if (req.method === 'GET') {
      // Get all subscription packages
      const result = await pool.query(`
        SELECT * FROM subscription_packages 
        ORDER BY created_at DESC
      `);
      
      res.json(result.rows);
      
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
      
      if (!name || price === undefined) {
        return res.status(400).json({ 
          message: 'Name and price are required' 
        });
      }
      
      const result = await pool.query(`
        INSERT INTO subscription_packages (
          name, description, price, billing_interval, trial_days,
          max_venues, max_users, max_bookings_per_month,
          features, is_active, sort_order, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `, [
        name, description, price, billingInterval, trialDays,
        maxVenues, maxUsers, maxBookingsPerMonth,
        JSON.stringify(features), isActive, sortOrder
      ]);
      
      res.status(201).json(result.rows[0]);
      
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
      
      const fieldMap = {
        name: 'name',
        description: 'description', 
        price: 'price',
        billingInterval: 'billing_interval',
        trialDays: 'trial_days',
        maxVenues: 'max_venues',
        maxUsers: 'max_users',
        maxBookingsPerMonth: 'max_bookings_per_month',
        features: 'features',
        isActive: 'is_active',
        sortOrder: 'sort_order'
      };
      
      for (const [key, value] of Object.entries(updates)) {
        if (fieldMap[key]) {
          updateFields.push(`${fieldMap[key]} = $${paramIndex}`);
          values.push(key === 'features' ? JSON.stringify(value) : value);
          paramIndex++;
        }
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }
      
      values.push(id);
      
      const query = `
        UPDATE subscription_packages 
        SET ${updateFields.join(', ')}, created_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json(result.rows[0]);
      
    } else if (req.method === 'DELETE') {
      // Delete package (set inactive instead)
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ message: 'Package ID is required' });
      }
      
      const result = await pool.query(`
        UPDATE subscription_packages 
        SET is_active = false, created_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Package not found' });
      }
      
      res.json({ message: 'Package deactivated successfully' });
      
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Packages API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};