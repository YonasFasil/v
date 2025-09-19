const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');
const jwt = require('jsonwebtoken');

let imapConnection = null;
let isMonitoring = false;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify super admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    // Get IMAP configuration from environment variables
    const host = process.env.GLOBAL_EMAIL_HOST;
    const port = process.env.GLOBAL_EMAIL_PORT;
    const user = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;

    if (!host || !port || !user || !password) {
      return res.status(400).json({
        success: false,
        message: 'IMAP configuration missing from environment variables'
      });
    }

    // Start IMAP monitoring
    if (isMonitoring) {
      return res.json({
        success: true,
        message: 'IMAP monitoring is already running',
        status: 'active'
      });
    }

    try {
      await startImapMonitoring({
        host,
        port: parseInt(port),
        user,
        password
      });

      return res.json({
        success: true,
        message: 'IMAP monitoring started successfully',
        status: 'started',
        config: {
          host,
          port: parseInt(port),
          user
        }
      });
    } catch (error) {
      console.error('Failed to start IMAP monitoring:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to start IMAP monitoring',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Start IMAP monitoring error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start IMAP monitoring',
      error: error.message
    });
  }
}

async function startImapMonitoring(config) {
  return new Promise((resolve, reject) => {
    try {
      // Note: For IMAP reading, we need port 993 (IMAP SSL)
      // The SMTP port 465 is only for sending emails
      const imapConfig = {
        user: config.user,
        password: config.password,
        host: config.host,
        port: 993, // Force IMAP port regardless of environment variable
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      };

      imapConnection = new Imap(imapConfig);

      imapConnection.once('ready', function() {
        console.log('📧 IMAP connection ready, opening inbox...');
        isMonitoring = true;

        imapConnection.openBox('INBOX', false, function(err, box) {
          if (err) {
            console.error('❌ Failed to open inbox:', err);
            reject(err);
            return;
          }

          console.log('📬 Inbox opened, monitoring for new emails...');

          // Listen for new emails
          imapConnection.on('mail', function() {
            console.log('📧 New email received, processing...');
            processNewEmails();
          });

          // Process any existing unseen emails
          processNewEmails();
          resolve();
        });
      });

      imapConnection.once('error', function(err) {
        console.error('❌ IMAP connection error:', err);
        isMonitoring = false;
        reject(err);
      });

      imapConnection.once('end', function() {
        console.log('📧 IMAP connection ended');
        isMonitoring = false;
      });

      imapConnection.connect();
    } catch (error) {
      reject(error);
    }
  });
}

function processNewEmails() {
  if (!imapConnection) return;

  // Search for unseen emails
  imapConnection.search(['UNSEEN'], function(err, results) {
    if (err) {
      console.error('❌ Email search error:', err);
      return;
    }

    if (!results || results.length === 0) {
      console.log('📭 No new emails to process');
      return;
    }

    console.log(`📧 Processing ${results.length} new email(s)`);

    const fetch = imapConnection.fetch(results, {
      bodies: '',
      markSeen: true
    });

    fetch.on('message', function(msg, seqno) {
      processEmailMessage(msg, seqno);
    });

    fetch.once('error', function(err) {
      console.error('❌ Fetch error:', err);
    });
  });
}

function processEmailMessage(msg, seqno) {
  let rawEmail = '';

  msg.on('body', function(stream) {
    stream.on('data', function(chunk) {
      rawEmail += chunk.toString('utf8');
    });

    stream.once('end', async function() {
      try {
        const parsed = await simpleParser(rawEmail);
        await handleIncomingEmail(parsed);
      } catch (error) {
        console.error('❌ Error parsing email:', error);
      }
    });
  });

  msg.once('attributes', function(attrs) {
    console.log(`📧 Processing email ${seqno} - ${attrs.envelope?.subject || 'No Subject'}`);
  });
}

async function handleIncomingEmail(email) {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error('❌ Database not configured');
    return;
  }

  let pool;
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    const fromEmail = email.from?.value?.[0]?.address;
    const toEmail = email.to?.value?.[0]?.address;
    const subject = email.subject || '';
    const textContent = email.text || '';
    const htmlContent = email.html || '';

    console.log('📧 Processing email from:', fromEmail, 'to:', toEmail);

    // Extract token from the "to" address (format: notifications+token@venuine.com)
    const token = extractTokenFromEmail(toEmail);

    if (!token) {
      console.log('📧 No token found in email, skipping tracking');
      return;
    }

    console.log('🔍 Found token in email:', token);

    // Look up the token in the database
    const tokenQuery = `
      SELECT tenant_id, record_type, record_id, customer_email, thread_id
      FROM communication_tokens
      WHERE token = $1 AND expires_at > NOW()
    `;

    const tokenResult = await pool.query(tokenQuery, [token]);

    if (tokenResult.rows.length === 0) {
      console.log('🔍 Token not found or expired, skipping');
      return;
    }

    const tokenData = tokenResult.rows[0];
    console.log('✅ Token found for tenant:', tokenData.tenant_id);

    // Record the incoming communication
    const { v4: uuidv4 } = require('uuid');
    const communicationId = uuidv4();

    const insertQuery = `
      INSERT INTO communications (
        id, tenant_id, type, subject, message,
        sender, recipient,
        customer_id, booking_id, proposal_id,
        status, sent_at, email_message_id,
        thread_id, reply_to_address, direction
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, NOW(), $12, $13, $14, $15
      )
    `;

    await pool.query(insertQuery, [
      communicationId,
      tokenData.tenant_id,
      'email_reply',
      subject,
      textContent || htmlContent,
      fromEmail,
      toEmail,
      null, // customer_id
      tokenData.record_type === 'booking' ? tokenData.record_id : null,
      tokenData.record_type === 'proposal' ? tokenData.record_id : null,
      'received',
      email.messageId || null,
      tokenData.thread_id,
      fromEmail, // reply_to_address is the customer's email
      'inbound'
    ]);

    console.log('✅ Incoming email recorded in communication history');

  } catch (error) {
    console.error('❌ Error handling incoming email:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

function extractTokenFromEmail(email) {
  if (!email) return null;

  // Format: notifications+token@venuine.com
  const match = email.match(/\+([^@]+)@/);
  return match ? match[1] : null;
}