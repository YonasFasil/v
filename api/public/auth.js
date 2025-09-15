const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabaseUrl } = require('../db-config.js');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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

    const { action } = req.query;

    if (req.method === 'POST' && action === 'register') {
      // Register new public customer
      const { email, password, firstName, lastName, phone, companyName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'Email, password, first name, and last name are required' });
      }

      // Check if email already exists
      const existingUser = await pool.query(
        'SELECT id FROM public_customers WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Insert new customer
      const result = await pool.query(`
        INSERT INTO public_customers (
          email, password_hash, first_name, last_name, phone, company_name
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, first_name, last_name, phone, company_name, is_verified, created_at
      `, [email.toLowerCase(), passwordHash, firstName, lastName, phone, companyName]);

      const customer = result.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { customerId: customer.id, email: customer.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Registration successful',
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          companyName: customer.company_name,
          isVerified: customer.is_verified
        },
        token
      });

    } else if (req.method === 'POST' && action === 'login') {
      // Login public customer
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find customer
      const result = await pool.query(`
        SELECT id, email, password_hash, first_name, last_name, phone,
               company_name, is_verified, is_active
        FROM public_customers
        WHERE email = $1
      `, [email.toLowerCase()]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const customer = result.rows[0];

      if (!customer.is_active) {
        return res.status(401).json({ message: 'Account has been deactivated' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, customer.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Update last login
      await pool.query(
        'UPDATE public_customers SET last_login_at = NOW() WHERE id = $1',
        [customer.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { customerId: customer.id, email: customer.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        customer: {
          id: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          companyName: customer.company_name,
          isVerified: customer.is_verified
        },
        token
      });

    } else if (req.method === 'GET' && action === 'verify') {
      // Verify JWT token
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get current customer data
        const result = await pool.query(`
          SELECT id, email, first_name, last_name, phone, company_name, is_verified
          FROM public_customers
          WHERE id = $1 AND is_active = true
        `, [decoded.customerId]);

        if (result.rows.length === 0) {
          return res.status(401).json({ message: 'Invalid token' });
        }

        const customer = result.rows[0];

        return res.json({
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: customer.phone,
            companyName: customer.company_name,
            isVerified: customer.is_verified
          }
        });

      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

    } else if (req.method === 'PUT' && action === 'profile') {
      // Update customer profile
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { firstName, lastName, phone, companyName } = req.body;

        const result = await pool.query(`
          UPDATE public_customers
          SET first_name = COALESCE($1, first_name),
              last_name = COALESCE($2, last_name),
              phone = COALESCE($3, phone),
              company_name = COALESCE($4, company_name),
              updated_at = NOW()
          WHERE id = $5
          RETURNING id, email, first_name, last_name, phone, company_name, is_verified
        `, [firstName, lastName, phone, companyName, decoded.customerId]);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Customer not found' });
        }

        const customer = result.rows[0];

        return res.json({
          message: 'Profile updated successfully',
          customer: {
            id: customer.id,
            email: customer.email,
            firstName: customer.first_name,
            lastName: customer.last_name,
            phone: customer.phone,
            companyName: customer.company_name,
            isVerified: customer.is_verified
          }
        });

      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }

    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Public auth API error:', error);
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