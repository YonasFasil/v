const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../db-config.js');

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required'
      });
    }

    // Find customer with this verification token
    const result = await pool.query(`
      SELECT id, first_name, last_name, email, is_verified, verification_token, created_at
      FROM public_customers
      WHERE verification_token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Invalid or expired verification token'
      });
    }

    const customer = result.rows[0];

    // Check if already verified
    if (customer.is_verified) {
      return res.status(200).json({
        message: 'Email address is already verified',
        alreadyVerified: true
      });
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - new Date(customer.created_at).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (tokenAge > twentyFourHours) {
      return res.status(400).json({
        message: 'Verification token has expired. Please request a new one.',
        expired: true
      });
    }

    // Verify the email
    await pool.query(`
      UPDATE public_customers
      SET is_verified = true,
          verification_token = NULL,
          updated_at = NOW()
      WHERE id = $1
    `, [customer.id]);

    return res.status(200).json({
      message: 'Email verified successfully! You can now login to your account.',
      success: true,
      customer: {
        id: customer.id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
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