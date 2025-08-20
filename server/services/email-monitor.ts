import { storage } from '../storage';
import { gmailService } from './gmail';
import { ImapFlow } from 'imapflow';

interface EmailMonitorConfig {
  email: string;
  appPassword: string;
}

interface ParsedEmailReply {
  from: string;
  subject: string;
  content: string;
  receivedDate: Date;
  messageId: string; // Unique email message ID
  inReplyTo?: string;
  references?: string[];
  proposalId?: string;
}

export class EmailMonitorService {
  private config: EmailMonitorConfig | null = null;
  private monitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date = new Date();
  private processedMessageIds = new Set<string>(); // Track processed message IDs

  constructor(config?: EmailMonitorConfig) {
    if (config) {
      this.configure(config);
    }
  }

  configure(config: EmailMonitorConfig) {
    this.config = config;
    // Configure Gmail service with the same credentials for monitoring
    gmailService.configure({ email: config.email, appPassword: config.appPassword });
    console.log('Email monitoring configured for:', config.email);
  }

  async startMonitoring(): Promise<void> {
    if (!this.config) {
      throw new Error('Email monitor not configured');
    }

    if (this.monitoringActive) {
      console.log('Email monitoring already active');
      return;
    }

    // Test Gmail connection first
    const isConnected = await gmailService.testConnection();
    if (!isConnected) {
      throw new Error('Gmail connection failed. Please check your credentials.');
    }

    console.log('✅ Email monitoring started - checking for new customer replies every 30 seconds');
    this.monitoringActive = true;
    this.lastCheckTime = new Date();
    
    // Start periodic monitoring
    this.startPeriodicCheck();
  }

  private startPeriodicCheck(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Check for new emails every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      if (this.monitoringActive) {
        await this.checkForNewReplies();
      }
    }, 30000);

    // Also check immediately
    setTimeout(() => this.checkForNewReplies(), 1000);
  }

  private async checkForNewReplies(): Promise<void> {
    if (!this.config || !gmailService.isConfigured()) {
      return;
    }

    try {
      console.log('🔍 Checking for new customer email replies...');
      
      // Get all recent inbound emails since last check
      const recentEmails = await this.fetchRecentInboundEmails();
      
      if (recentEmails.length > 0) {
        console.log(`Found ${recentEmails.length} recent emails to process`);
        
        for (const email of recentEmails) {
          await this.processIncomingEmail(email);
        }
      }
      
      this.lastCheckTime = new Date();
      
    } catch (error) {
      console.error('Error checking for email replies:', error);
    }
  }

  private async fetchRecentInboundEmails(): Promise<any[]> {
    if (!this.config) return [];

    let client: ImapFlow | null = null;
    
    try {
      // Connect to Gmail using IMAP
      client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
          user: this.config.email,
          pass: this.config.appPassword
        }
      });

      await client.connect();
      
      // Open inbox
      await client.mailboxOpen('INBOX');
      
      // Search for emails received since last check that are NOT from our own email
      const searchCriteria = {
        since: this.lastCheckTime,
        not: {
          from: this.config.email // Exclude emails from our own address
        }
      };
      
      const messageList = await client.search(searchCriteria);
      const emails = [];
      
      for await (const message of client.fetch(messageList, { 
        envelope: true, 
        bodyStructure: true,
        bodyParts: ['TEXT'] 
      })) {
        try {
          if (!message.envelope) continue;
          
          const envelope = message.envelope;
          const from = envelope.from?.[0]?.address;
          const subject = envelope.subject;
          const date = envelope.date;
          const messageId = envelope.messageId || `${from}-${date?.getTime()}-${Math.random()}`;
          
          if (!from || !subject || !date) continue;
          
          // Skip if already processed
          if (this.processedMessageIds.has(messageId)) {
            console.log(`⏭️ Skipping already processed email: ${messageId.substring(0, 50)}...`);
            continue;
          }
          
          // Get text content
          let content = '';
          if (message.bodyParts && message.bodyParts.get('TEXT')) {
            content = message.bodyParts.get('TEXT')?.toString('utf8') || '';
          } else {
            content = 'Customer replied to proposal'; // fallback
          }
          
          emails.push({
            from,
            subject,
            content,
            date,
            messageId
          });
          
        } catch (msgError) {
          console.error('Error processing message:', msgError);
          continue;
        }
      }
      
      return emails;
      
    } catch (error) {
      console.error('Error fetching emails from Gmail:', error);
      return [];
    } finally {
      if (client) {
        try {
          await client.logout();
        } catch (logoutError) {
          console.error('Error closing IMAP connection:', logoutError);
        }
      }
    }
  }

  private async processIncomingEmail(email: any): Promise<void> {
    try {
      // Mark this message as processed to prevent duplicates
      this.processedMessageIds.add(email.messageId);
      
      const parsedReply: ParsedEmailReply = {
        from: email.from,
        subject: email.subject,
        content: this.cleanEmailContent(email.content),
        receivedDate: new Date(email.date),
        messageId: email.messageId
      };

      // Try to match this reply to a proposal
      const proposalId = await this.findProposalForReply(parsedReply);
      if (!proposalId) {
        console.log('No matching proposal found for email reply from:', parsedReply.from);
        return;
      }

      // Check if this exact message has already been recorded in the database
      const existingComm = await storage.getCommunicationByMessageId(email.messageId);
      if (existingComm) {
        console.log(`⏭️ Email already recorded in database: ${email.messageId.substring(0, 50)}...`);
        return;
      }

      console.log(`📧 Customer reply detected! Recording for proposal ${proposalId}`);
      await this.recordCustomerReply(proposalId, parsedReply);
      
    } catch (error) {
      console.error('Error processing incoming email:', error);
    }
  }

  // Webhook endpoint to receive email notifications
  async processWebhookEmail(emailData: {
    from: string;
    subject: string;
    content: string;
    receivedAt: string;
  }): Promise<boolean> {
    try {
      const parsedReply: ParsedEmailReply = {
        from: emailData.from,
        subject: emailData.subject,
        content: this.cleanEmailContent(emailData.content),
        receivedDate: new Date(emailData.receivedAt)
      };

      // Try to match this reply to a proposal
      const proposalId = await this.findProposalForReply(parsedReply);
      if (!proposalId) {
        console.log('No matching proposal found for email reply from:', parsedReply.from);
        return false;
      }

      // Record the customer reply
      await this.recordCustomerReply(proposalId, parsedReply);
      return true;
    } catch (error) {
      console.error('Error processing webhook email:', error);
      return false;
    }
  }

  // Manual method to record customer reply
  async recordManualReply(data: {
    proposalId: string;
    customerEmail: string;
    subject: string;
    content: string;
    receivedAt?: string;
  }): Promise<boolean> {
    try {
      const parsedReply: ParsedEmailReply = {
        from: data.customerEmail,
        subject: data.subject,
        content: this.cleanEmailContent(data.content),
        receivedDate: data.receivedAt ? new Date(data.receivedAt) : new Date()
      };

      await this.recordCustomerReply(data.proposalId, parsedReply);
      return true;
    } catch (error) {
      console.error('Error recording manual reply:', error);
      return false;
    }
  }

  private cleanEmailContent(content: string): string {
    // Remove common email signatures and quoted text
    const lines = content.split('\n');
    const cleanedLines: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Stop at common quote indicators
      if (trimmedLine.startsWith('>') || 
          trimmedLine.startsWith('On ') || 
          trimmedLine.includes('wrote:') ||
          trimmedLine.includes('From:') ||
          trimmedLine.includes('Sent:') ||
          trimmedLine.includes('To:') ||
          trimmedLine.includes('Subject:')) {
        break;
      }
      
      cleanedLines.push(line);
    }
    
    return cleanedLines.join('\n').trim();
  }

  private async findProposalForReply(reply: ParsedEmailReply): Promise<string | null> {
    try {
      // First, try to find by customer email
      const proposals = await storage.getProposals();
      
      for (const proposal of proposals) {
        // Check if the email is from the proposal's customer
        const customer = await storage.getCustomer(proposal.customerId);
        if (customer && customer.email === reply.from) {
          // Additional validation: check if proposal was sent recently (within last 30 days)
          const proposalDate = new Date(proposal.sentAt || proposal.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (proposalDate > thirtyDaysAgo) {
            console.log(`✅ Found matching proposal ${proposal.id} for customer reply from ${reply.from}`);
            return proposal.id;
          }
        }
      }
      
      console.log(`No recent proposal found for email from ${reply.from}`);
      return null;
    } catch (error) {
      console.error('Error finding proposal for reply:', error);
      return null;
    }
  }

  private async recordCustomerReply(proposalId: string, reply: ParsedEmailReply): Promise<void> {
    try {
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        console.error('Proposal not found:', proposalId);
        return;
      }

      const communicationData = {
        proposalId,
        customerId: proposal.customerId,
        type: 'email' as const,
        direction: 'inbound' as const,
        subject: reply.subject,
        message: reply.content,
        sender: reply.from,
        recipient: this.config?.email || 'venue',
        emailMessageId: reply.messageId,
        status: 'received' as const,
        sentAt: reply.receivedDate,
      };

      await storage.createCommunication(communicationData);
      
      console.log(`✅ Recorded customer reply for proposal ${proposalId} from ${reply.from}`);
    } catch (error) {
      console.error('Error recording customer reply:', error);
    }
  }

  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Email monitoring stopped');
  }

  isMonitoring(): boolean {
    return this.monitoringActive;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }
}

// Global instance
export const emailMonitorService = new EmailMonitorService();