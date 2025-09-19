const Imap = require('imap');
const { Pool } = require('pg');
const { getDatabaseUrl } = require('../../api/db-config.js');
const { v4: uuidv4 } = require('uuid');

class GlobalEmailService {
  constructor() {
    this.pool = null;
    this.imapConfig = null;
    this.imap = null;
    this.isConnected = false;
    this.isProcessing = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async init() {
    try {
      // Setup database connection
      const databaseUrl = getDatabaseUrl();
      if (!databaseUrl) {
        throw new Error('Database not configured');
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
      });

      // Load IMAP configuration from database
      await this.loadImapConfig();

      if (this.imapConfig && this.imapConfig.enabled) {
        await this.connectToImap();
        console.log('🚀 Global Email Service initialized successfully');
      } else {
        console.log('⚠️ IMAP not configured or disabled');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Global Email Service:', error);
    }
  }

  async loadImapConfig() {
    try {
      const result = await this.pool.query(
        'SELECT * FROM imap_config WHERE enabled = true LIMIT 1'
      );

      if (result.rows.length > 0) {
        this.imapConfig = result.rows[0];
        console.log('✅ IMAP config loaded:', {
          email: this.imapConfig.email,
          host: this.imapConfig.host,
          port: this.imapConfig.port
        });
      } else {
        this.imapConfig = null;
        console.log('⚠️ No IMAP configuration found');
      }
    } catch (error) {
      console.error('❌ Failed to load IMAP config:', error);
      this.imapConfig = null;
    }
  }

  async connectToImap() {
    if (!this.imapConfig) {
      throw new Error('IMAP configuration not loaded');
    }

    try {
      this.imap = new Imap({
        user: this.imapConfig.email,
        password: this.imapConfig.password,
        host: this.imapConfig.host,
        port: this.imapConfig.port,
        tls: this.imapConfig.port === 993,
        secure: this.imapConfig.port === 993,
        tlsOptions: {
          rejectUnauthorized: false
        },
        keepalive: true
      });

      return new Promise((resolve, reject) => {
        let connectionTimeout = setTimeout(() => {
          this.imap.destroy();
          reject(new Error('IMAP connection timeout'));
        }, 30000);

        this.imap.once('ready', () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('✅ Connected to IMAP server');

          // Set up event handlers
          this.setupEventHandlers();

          // Start monitoring inbox
          this.monitorInbox();

          resolve();
        });

        this.imap.once('error', (err) => {
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          console.error('❌ IMAP connection error:', err);
          reject(err);
        });

        this.imap.once('end', () => {
          this.isConnected = false;
          console.log('📪 IMAP connection ended');
          this.handleReconnect();
        });

        this.imap.connect();
      });
    } catch (error) {
      console.error('❌ Failed to connect to IMAP:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.imap.on('mail', (numNewMsgs) => {
      console.log(`📬 ${numNewMsgs} new email(s) received`);
      if (!this.isProcessing) {
        this.processNewEmails();
      }
    });
  }

  async monitorInbox() {
    try {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('❌ Failed to open INBOX:', err);
          return;
        }
        console.log('📥 Monitoring INBOX for new emails...');

        // Process any existing unread emails
        this.processNewEmails();
      });
    } catch (error) {
      console.error('❌ Failed to monitor inbox:', error);
    }
  }

  async processNewEmails() {
    if (this.isProcessing) {
      console.log('⏳ Already processing emails, skipping...');
      return;
    }

    this.isProcessing = true;
    console.log('🔄 Processing new emails...');

    try {
      // Search for unread emails
      this.imap.search(['UNSEEN'], (err, results) => {
        if (err) {
          console.error('❌ Email search error:', err);
          this.isProcessing = false;
          return;
        }

        if (!results || results.length === 0) {
          console.log('📭 No new emails to process');
          this.isProcessing = false;
          return;
        }

        console.log(`📧 Found ${results.length} unread email(s)`);

        const fetch = this.imap.fetch(results, {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO)', 'TEXT'],
          markSeen: true
        });

        fetch.on('message', (msg) => {
          this.processEmailMessage(msg);
        });

        fetch.once('error', (err) => {
          console.error('❌ Fetch error:', err);
          this.isProcessing = false;
        });

        fetch.once('end', () => {
          console.log('✅ Finished processing emails');
          this.isProcessing = false;
        });
      });
    } catch (error) {
      console.error('❌ Failed to process new emails:', error);
      this.isProcessing = false;
    }
  }

  processEmailMessage(msg) {
    let headers = {};
    let body = '';

    msg.on('body', (stream, info) => {
      let buffer = '';

      stream.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
      });

      stream.once('end', () => {
        if (info.which === 'TEXT') {
          body = buffer;
        } else {
          // Parse headers
          const headerLines = buffer.split('\r\n');
          headerLines.forEach(line => {
            if (line.startsWith('From: ')) headers.from = line.substring(6).trim();
            if (line.startsWith('To: ')) headers.to = line.substring(4).trim();
            if (line.startsWith('Subject: ')) headers.subject = line.substring(9).trim();
            if (line.startsWith('Date: ')) headers.date = line.substring(6).trim();
            if (line.startsWith('Message-ID: ')) headers.messageId = line.substring(12).trim();
            if (line.startsWith('In-Reply-To: ')) headers.inReplyTo = line.substring(13).trim();
          });
        }
      });
    });

    msg.once('end', () => {
      this.handleIncomingEmail(headers, body);
    });
  }

  async handleIncomingEmail(headers, body) {
    try {
      console.log('📧 Processing email:', {
        from: headers.from,
        to: headers.to,
        subject: headers.subject
      });

      // Check if this email is a reply to a communication (contains token)
      // Works with any configured notification email domain
      const tokenMatch = headers.to?.match(/\+([a-f0-9]{16})@/);
      if (!tokenMatch) {
        console.log('⚠️ No token found in email, not a tracked communication');
        return;
      }

      const token = tokenMatch[1];
      console.log('🔑 Found communication token:', token);

      // Look up the token in the database
      const tokenQuery = await this.pool.query(`
        SELECT tenant_id, record_type, record_id, customer_email, thread_id
        FROM communication_tokens
        WHERE token = $1 AND expires_at > NOW()
      `, [token]);

      if (tokenQuery.rows.length === 0) {
        console.warn('❌ Token not found or expired:', token);
        return;
      }

      const tokenData = tokenQuery.rows[0];
      console.log('✅ Token data found:', tokenData);

      // Extract clean email from "Name <email>" format
      const cleanFrom = this.extractEmail(headers.from);

      // Verify the sender matches the token's customer email
      if (cleanFrom.toLowerCase() !== tokenData.customer_email.toLowerCase()) {
        console.warn('❌ Sender mismatch:', {
          from: cleanFrom,
          expected: tokenData.customer_email
        });
        return;
      }

      // Generate communication ID
      const communicationId = uuidv4();

      // Try to find the original communication for this thread
      let parentCommunicationId = null;
      if (tokenData.thread_id) {
        const parentQuery = await this.pool.query(`
          SELECT id FROM communications
          WHERE thread_id = $1 AND direction = 'outbound'
          ORDER BY sent_at DESC
          LIMIT 1
        `, [tokenData.thread_id]);

        if (parentQuery.rows.length > 0) {
          parentCommunicationId = parentQuery.rows[0].id;
        }
      }

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

      await this.pool.query(insertQuery, [
        communicationId,
        tokenData.tenant_id,
        'reply',
        headers.subject || 'Re: Email Reply',
        body || 'No content',
        cleanFrom,
        headers.to,
        null, // customer_id - could be looked up if needed
        tokenData.record_type === 'booking' ? tokenData.record_id : null,
        tokenData.record_type === 'proposal' ? tokenData.record_id : null,
        'received',
        headers.date ? new Date(headers.date) : new Date(),
        headers.messageId,
        tokenData.thread_id,
        'inbound',
        parentCommunicationId
      ]);

      // Update token usage
      await this.pool.query(`
        UPDATE communication_tokens
        SET used_count = used_count + 1, last_used_at = NOW()
        WHERE token = $1
      `, [token]);

      console.log('✅ Email reply processed successfully:', {
        communicationId,
        threadId: tokenData.thread_id,
        from: cleanFrom,
        subject: headers.subject
      });

    } catch (error) {
      console.error('❌ Failed to handle incoming email:', error);
    }
  }

  extractEmail(emailString) {
    if (!emailString) return '';

    // Extract email from "Name <email@domain.com>" format
    const match = emailString.match(/<([^>]+)>/);
    if (match) {
      return match[1];
    }

    // If no angle brackets, assume it's just the email
    return emailString.trim();
  }

  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Email monitoring stopped.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    console.log(`🔄 Attempting to reconnect to IMAP (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    setTimeout(async () => {
      try {
        await this.connectToImap();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.handleReconnect();
      }
    }, delay);
  }

  async close() {
    if (this.imap && this.isConnected) {
      this.imap.end();
    }
    if (this.pool) {
      await this.pool.end();
    }
    console.log('🛑 Global Email Service stopped');
  }
}

module.exports = GlobalEmailService;