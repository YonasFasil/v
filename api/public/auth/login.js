const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('../../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
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

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Find customer by email
    const result = await pool.query(`
      SELECT id, first_name, last_name, email, phone, password_hash,
             is_verified, is_active, created_at, last_login_at
      FROM public_customers
      WHERE email = $1
    `, [email.toLowerCase().trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const customer = result.rows[0];

    // Check if account is active
    if (!customer.is_active) {
      return res.status(401).json({
        message: 'Account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, customer.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Update last login time
    await pool.query(
      'UPDATE public_customers SET last_login_at = NOW() WHERE id = $1',
      [customer.id]
    );

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
        type: 'public_customer'
      },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // Remove sensitive data
    const safeCustomer = {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      isVerified: customer.is_verified,
      isActive: customer.is_active,
      createdAt: customer.created_at,
      lastLoginAt: new Date()
    };

    return res.status(200).json({
      message: 'Login successful',
      customer: safeCustomer,
      token
    });

  } catch (error) {
    console.error('Customer login error:', error);

    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};