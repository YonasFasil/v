const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
      const packages = await pool.query('SELECT * FROM subscription_packages WHERE is_active = true ORDER BY price_monthly ASC');
      return res.json(packages.rows);
    }
    
    return res.status(404).json({ message: 'Not found' });
    
  } catch (error) {
    console.error('Subscription packages API error:', error);
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
