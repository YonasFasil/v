const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');
const { hashPassword } = require('../../server/middleware/auth');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
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

    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Create a new tenant
    const tenantId = uuidv4();
    const newTenant = await pool.query(
      'INSERT INTO tenants (id, name) VALUES ($1, $2) RETURNING *',
      [tenantId, companyName]
    );

    // Create the new user
    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, tenant_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, hashedPassword, tenantId, 'tenant_admin']
    );

    // We can generate a token here and send it back for auto-login if desired
    // For now, we'll just confirm creation and let them log in.

    res.status(201).json({ message: 'Account created successfully' });

  } catch (error) {
    console.error('Signup API error:', error);
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
