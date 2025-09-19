const { Pool } = require('pg');
const { getDatabaseUrl } = require('../db-config.js');

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

  let pool;

  try {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      return res.status(500).json({ message: 'Database not configured' });
    }

    // Setup database connection
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    // Parse incoming email data (format depends on your email service)
    const {
      to,           // The reply-to address: email+token@domain.com
      from,         // Customer's email
      subject,      // Email subject
      text,         // Plain text content
      html,         // HTML content
      messageId,    // Email message ID
      inReplyTo,    // Reference to original message
      date          // Email timestamp
    } = req.body;

    console.log('📧 Incoming email received:', { to, from, subject });

    // Extract token from the "to" address
    const tokenMatch = to?.match(/\+([a-f0-9]{16})@/);
    if (!tokenMatch) {
      console.warn('❌ No token found in email address:', to);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const token = tokenMatch[1];
    console.log('🔑 Extracted token:', token);

    // Look up the token in the database
    const tokenQuery = await pool.query(`
      SELECT tenant_id, record_type, record_id, customer_email, thread_id
      FROM communication_tokens
      WHERE token = $1 AND expires_at > NOW()
    `, [token]);

    if (tokenQuery.rows.length === 0) {
      console.warn('❌ Token not found or expired:', token);
      return res.status(404).json({ error: 'Token not found or expired' });
    }

    const tokenData = tokenQuery.rows[0];
    console.log('✅ Token data found:', tokenData);

    // Verify the sender matches the token's customer email
    if (from.toLowerCase() !== tokenData.customer_email.toLowerCase()) {
      console.warn('❌ Sender mismatch:', { from, expected: tokenData.customer_email });
      return res.status(403).json({ error: 'Unauthorized sender' });
    }

    // Generate communication ID
    const { v4: uuidv4 } = require('uuid');
    const communicationId = uuidv4();

    // Store the incoming communication
    const insertQuery = `
      INSERT INTO communications (
        id, tenant_id, type, subject, message,
        sender, recipient,
        customer_id, booking_id, proposal_id,
        status, sent_at, email_message_id,
        thread_id, direction, parent_communication_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
    `;

    // Try to find the original communication for this thread
    let parentCommunicationId = null;
    if (tokenData.thread_id) {
      const parentQuery = await pool.query(`
        SELECT id FROM communications
        WHERE thread_id = $1 AND direction = 'outbound'
        ORDER BY sent_at DESC
        LIMIT 1
      `, [tokenData.thread_id]);

      if (parentQuery.rows.length > 0) {
        parentCommunicationId = parentQuery.rows[0].id;
      }
    }

    await pool.query(insertQuery, [
      communicationId,
      tokenData.tenant_id,
      'reply',
      subject || 'Re: Email Reply',
      text || html || 'No content',
      from,
      to,
      null, // customer_id - could be looked up if needed
      tokenData.record_type === 'booking' ? tokenData.record_id : null,
      tokenData.record_type === 'proposal' ? tokenData.record_id : null,
      'received',
      date ? new Date(date) : new Date(),
      messageId,
      tokenData.thread_id,
      'inbound',
      parentCommunicationId
    ]);

    // Update token usage
    await pool.query(`
      UPDATE communication_tokens
      SET used_count = used_count + 1, last_used_at = NOW()
      WHERE token = $1
    `, [token]);

    console.log('✅ Incoming email processed:', {
      communicationId,
      threadId: tokenData.thread_id,
      from,
      subject
    });

    return res.status(200).json({
      success: true,
      message: 'Email processed successfully',
      communicationId,
      threadId: tokenData.thread_id
    });

  } catch (error) {
    console.error('❌ Incoming email processing error:', error);
    return res.status(500).json({
      error: 'Failed to process incoming email',
      message: error.message
    });
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}