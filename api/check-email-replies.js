const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('./db-config.js');

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
    // Get IMAP configuration from environment variables
    const host = process.env.GLOBAL_EMAIL_HOST;
    const user = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;

    if (!host || !user || !password) {
      return res.status(400).json({
        success: false,
        message: 'IMAP configuration missing from environment variables'
      });
    }

    const result = await checkEmailReplies({
      host,
      port: 993, // IMAP SSL port
      user,
      password
    });

    return res.json(result);

  } catch (error) {
    console.error('Check email replies error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check email replies',
      error: error.message
    });
  }
}

async function checkEmailReplies(config) {
  return new Promise((resolve, reject) => {
    let processedEmails = 0;
    let newReplies = [];

    const imap = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', function() {
      console.log('📧 IMAP connection ready, checking for new emails...');

      imap.openBox('INBOX', false, function(err, box) {
        if (err) {
          console.error('❌ Failed to open inbox:', err);
          reject({ success: false, message: 'Failed to open inbox', error: err.message });
          return;
        }

        console.log('📬 Inbox opened, searching for unseen emails...');

        // Search for unseen emails
        imap.search(['UNSEEN'], function(err, results) {
          if (err) {
            console.error('❌ Email search error:', err);
            reject({ success: false, message: 'Email search failed', error: err.message });
            return;
          }

          if (!results || results.length === 0) {
            console.log('📭 No new emails found');
            imap.end();
            resolve({
              success: true,
              message: 'No new emails to process',
              processedEmails: 0,
              newReplies: []
            });
            return;
          }

          console.log(`📧 Found ${results.length} new email(s), processing...`);

          const fetch = imap.fetch(results, {
            bodies: '',
            markSeen: true
          });

          fetch.on('message', function(msg, seqno) {
            let rawEmail = '';

            msg.on('body', function(stream) {
              stream.on('data', function(chunk) {
                rawEmail += chunk.toString('utf8');
              });

              stream.once('end', async function() {
                try {
                  const parsed = await simpleParser(rawEmail);
                  const replyResult = await handleIncomingEmail(parsed);

                  if (replyResult.success) {
                    newReplies.push(replyResult.reply);
                  }

                  processedEmails++;

                  // If this is the last email, resolve
                  if (processedEmails === results.length) {
                    imap.end();
                    resolve({
                      success: true,
                      message: `Processed ${processedEmails} emails`,
                      processedEmails,
                      newReplies,
                      totalFound: results.length
                    });
                  }
                } catch (error) {
                  console.error('❌ Error parsing email:', error);
                  processedEmails++;

                  if (processedEmails === results.length) {
                    imap.end();
                    resolve({
                      success: true,
                      message: `Processed ${processedEmails} emails (with some errors)`,
                      processedEmails,
                      newReplies,
                      totalFound: results.length
                    });
                  }
                }
              });
            });

            msg.once('attributes', function(attrs) {
              console.log(`📧 Processing email ${seqno} - ${attrs.envelope?.subject || 'No Subject'}`);
            });
          });

          fetch.once('error', function(err) {
            console.error('❌ Fetch error:', err);
            reject({ success: false, message: 'Failed to fetch emails', error: err.message });
          });
        });
      });
    });

    imap.once('error', function(err) {
      console.error('❌ IMAP connection error:', err);
      reject({ success: false, message: 'IMAP connection failed', error: err.message });
    });

    imap.once('end', function() {
      console.log('📧 IMAP connection ended');
    });

    // Set a timeout to prevent hanging
    setTimeout(() => {
      if (imap.state !== 'disconnected') {
        imap.end();
        reject({ success: false, message: 'IMAP operation timed out' });
      }
    }, 30000); // 30 second timeout

    imap.connect();
  });
}

async function handleIncomingEmail(email) {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error('❌ Database not configured');
    return { success: false, message: 'Database not configured' };
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
      return { success: false, message: 'No token found' };
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
      return { success: false, message: 'Token not found or expired' };
    }

    const tokenData = tokenResult.rows[0];
    console.log('✅ Token found for tenant:', tokenData.tenant_id);

    // Check if this email was already processed
    const existingQuery = `
      SELECT id FROM communications
      WHERE email_message_id = $1 AND tenant_id = $2
    `;

    const existingResult = await pool.query(existingQuery, [email.messageId, tokenData.tenant_id]);

    if (existingResult.rows.length > 0) {
      console.log('📧 Email already processed, skipping');
      return { success: false, message: 'Email already processed' };
    }

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

    return {
      success: true,
      reply: {
        id: communicationId,
        tenantId: tokenData.tenant_id,
        proposalId: tokenData.record_type === 'proposal' ? tokenData.record_id : null,
        from: fromEmail,
        subject: subject,
        content: textContent || htmlContent
      }
    };

  } catch (error) {
    console.error('❌ Error handling incoming email:', error);
    return { success: false, message: error.message };
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