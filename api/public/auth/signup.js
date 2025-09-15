const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../db-config.js');

// Import with error handling
let bcrypt, jwt;
try {
  bcrypt = require('bcryptjs');
  jwt = require('jsonwebtoken');
} catch (importError) {
  console.error('Import error:', importError);
}

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
    // Check if required modules are available
    if (!bcrypt || !jwt) {
      return res.status(500).json({
        message: 'Server dependencies not available',
        error: 'bcrypt or jwt module not loaded'
      });
    }

    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    const { firstName, lastName, email, phone, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if customer already exists
    const existingCustomer = await pool.query(
      'SELECT id FROM public_customers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(400).json({
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create customer
    const result = await pool.query(`
      INSERT INTO public_customers (
        first_name, last_name, email, phone, password_hash,
        is_verified, is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, first_name, last_name, email, phone, is_verified, is_active, created_at
    `, [
      firstName.trim(),
      lastName.trim(),
      email.toLowerCase().trim(),
      phone.trim(),
      hashedPassword,
      false, // is_verified (not email_verified)
      true   // is_active (not status)
    ]);

    const customer = result.rows[0];

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
      createdAt: customer.created_at
    };

    return res.status(201).json({
      message: 'Account created successfully',
      customer: safeCustomer,
      token
    });

  } catch (error) {
    console.error('Customer signup error:', error);

    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({
        message: 'An account with this email already exists'
      });
    }

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