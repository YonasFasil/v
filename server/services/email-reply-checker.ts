const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { v4: uuidv4 } = require('uuid');
import { db } from '../db';
import { communications, communicationTokens } from '../db/schema';
import { eq } from 'drizzle-orm';

interface EmailReplyConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export async function checkEmailReplies(): Promise<any> {
  return new Promise((resolve, reject) => {
    let processedEmails = 0;
    let newReplies: any[] = [];

    // Get IMAP configuration from environment variables
    const host = process.env.GLOBAL_EMAIL_HOST;
    const user = process.env.GLOBAL_EMAIL_ADDRESS;
    const password = process.env.GLOBAL_EMAIL_PASSWORD;

    if (!host || !user || !password) {
      return reject({
        success: false,
        message: 'IMAP configuration missing from environment variables'
      });
    }

    const imap = new Imap({
      user,
      password,
      host,
      port: 993, // IMAP SSL port
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', function() {
      console.log('📧 IMAP connection ready, checking for new emails...');

      imap.openBox('INBOX', false, function(err: any, box: any) {
        if (err) {
          console.error('❌ Failed to open inbox:', err);
          reject({ success: false, message: 'Failed to open inbox', error: err.message });
          return;
        }

        console.log('📬 Inbox opened, searching for unseen emails...');

        // Search for unseen emails
        imap.search(['UNSEEN'], function(err: any, results: any) {
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

          fetch.on('message', function(msg: any, seqno: number) {
            let rawEmail = '';

            msg.on('body', function(stream: any) {
              stream.on('data', function(chunk: any) {
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

            msg.once('attributes', function(attrs: any) {
              console.log(`📧 Processing email ${seqno} - ${attrs.envelope?.subject || 'No Subject'}`);
            });
          });

          fetch.once('error', function(err: any) {
            console.error('❌ Fetch error:', err);
            reject({ success: false, message: 'Failed to fetch emails', error: err.message });
          });
        });
      });
    });

    imap.once('error', function(err: any) {
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

async function handleIncomingEmail(email: any) {
  try {
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
    const tokenResult = await db
      .select({
        tenantId: communicationTokens.tenantId,
        recordType: communicationTokens.recordType,
        recordId: communicationTokens.recordId,
        customerEmail: communicationTokens.customerEmail,
        threadId: communicationTokens.threadId
      })
      .from(communicationTokens)
      .where(eq(communicationTokens.token, token))
      .limit(1);

    if (tokenResult.length === 0) {
      console.log('🔍 Token not found or expired, skipping');
      return { success: false, message: 'Token not found or expired' };
    }

    const tokenData = tokenResult[0];
    console.log('✅ Token found for tenant:', tokenData.tenantId);

    // Check if this email was already processed
    const existingResult = await db
      .select({ id: communications.id })
      .from(communications)
      .where(eq(communications.emailMessageId, email.messageId))
      .limit(1);

    if (existingResult.length > 0) {
      console.log('📧 Email already processed, skipping');
      return { success: false, message: 'Email already processed' };
    }

    // Record the incoming communication
    const communicationId = uuidv4();

    await db.insert(communications).values({
      id: communicationId,
      tenantId: tokenData.tenantId,
      type: 'email_reply',
      subject: subject,
      message: textContent || htmlContent,
      sender: fromEmail,
      recipient: toEmail,
      customerId: null,
      bookingId: tokenData.recordType === 'booking' ? tokenData.recordId : null,
      proposalId: tokenData.recordType === 'proposal' ? tokenData.recordId : null,
      status: 'received',
      sentAt: new Date(),
      emailMessageId: email.messageId || null,
      threadId: tokenData.threadId,
      replyToAddress: fromEmail,
      direction: 'inbound'
    });

    console.log('✅ Incoming email recorded in communication history');

    return {
      success: true,
      reply: {
        id: communicationId,
        tenantId: tokenData.tenantId,
        proposalId: tokenData.recordType === 'proposal' ? tokenData.recordId : null,
        from: fromEmail,
        subject: subject,
        content: textContent || htmlContent
      }
    };

  } catch (error) {
    console.error('❌ Error handling incoming email:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function extractTokenFromEmail(email: string | undefined): string | null {
  if (!email) return null;

  // Format: notifications+token@venuine.com
  const match = email.match(/\+([^@]+)@/);
  return match ? match[1] : null;
}