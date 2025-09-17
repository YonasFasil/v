const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../db-config.js');
const crypto = require('crypto');

// Import with error handling
let bcrypt, jwt, nodemailer;
try {
  bcrypt = require('bcryptjs');
  jwt = require('jsonwebtoken');
  nodemailer = require('nodemailer');
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
    if (!bcrypt || !jwt || !nodemailer) {
      return res.status(500).json({
        message: 'Server dependencies not available',
        error: 'Required modules not loaded'
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create customer
    const result = await pool.query(`
      INSERT INTO public_customers (
        first_name, last_name, email, phone, password_hash,
        is_verified, is_active, verification_token, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, first_name, last_name, email, phone, is_verified, is_active, created_at
    `, [
      firstName.trim(),
      lastName.trim(),
      email.toLowerCase().trim(),
      phone.trim(),
      hashedPassword,
      false, // is_verified - starts as false until email verification
      true,  // is_active
      verificationToken
    ]);

    const customer = result.rows[0];

    // Send verification email
    try {
      await sendVerificationEmail(pool, customer, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails, but log it
    }

    // Generate JWT token (but user won't be able to login until verified)
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
      message: 'Account created successfully! Please check your email to verify your account.',
      customer: safeCustomer,
      requiresVerification: true
      // Don't return token until email is verified
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

// Helper function to send verification email
async function sendVerificationEmail(pool, customer, verificationToken) {
  // Get email configuration from database
  let emailConfig;
  try {
    const result = await pool.query(`
      SELECT setting_value
      FROM system_settings
      WHERE setting_key = 'email_config'
    `);

    if (result.rows.length === 0) {
      throw new Error('Email configuration not found');
    }

    emailConfig = JSON.parse(result.rows[0].setting_value);
  } catch (err) {
    throw new Error('Email service not configured');
  }

  if (!emailConfig.enabled) {
    throw new Error('Email service is disabled');
  }

  // Create transporter
  let transporter;
  if (emailConfig.provider === 'gmail') {
    transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailConfig.email,
        pass: emailConfig.password
      }
    });
  } else {
    throw new Error('Unsupported email provider');
  }

  // Create verification URL
  const baseUrl = process.env.FRONTEND_URL || 'https://venuine-pro.vercel.app';
  const verificationUrl = `${baseUrl}/customer/verify-email?token=${verificationToken}`;

  // Email content
  const mailOptions = {
    from: `"VenuinePro" <${emailConfig.email}>`,
    to: customer.email,
    subject: 'Verify Your VenuinePro Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">VenuinePro</h1>
          <p style="color: #6b7280; margin: 5px 0;">Welcome to the best venue booking platform</p>
        </div>

        <div style="background: #f9fafb; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="color: #111827; margin: 0 0 20px 0;">Welcome, ${customer.first_name}!</h2>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for creating your VenuinePro account. To get started exploring amazing venues
            and making bookings, please verify your email address by clicking the button below.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
            Or copy and paste this link into your browser:
            <br>
            <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Important:</strong> This verification link will expire in 24 hours.
            If you didn't create this account, please ignore this email.
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p><strong>What you can do after verification:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Browse and discover amazing venues</li>
            <li>Send booking inquiries to venue owners</li>
            <li>Track your booking history and communications</li>
            <li>Get personalized venue recommendations</li>
          </ul>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="margin: 0;">
            Need help? Contact us at <a href="mailto:${emailConfig.email}" style="color: #3b82f6;">${emailConfig.email}</a>
            <br>
            This email was sent to ${customer.email}
          </p>
        </div>
      </div>
    `,
    text: `
Welcome to VenuinePro, ${customer.first_name}!

Thank you for creating your account. To get started, please verify your email address by visiting:

${verificationUrl}

This verification link will expire in 24 hours.

After verification, you'll be able to:
- Browse and discover amazing venues
- Send booking inquiries to venue owners
- Track your booking history and communications
- Get personalized venue recommendations

Need help? Contact us at ${emailConfig.email}

If you didn't create this account, please ignore this email.
    `
  };

  // Send email
  await transporter.sendMail(mailOptions);
}