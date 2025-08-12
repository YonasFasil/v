import { storage } from '../storage';

interface EmailMonitorConfig {
  email: string;
  appPassword: string;
}

interface ParsedEmailReply {
  from: string;
  subject: string;
  content: string;
  receivedDate: Date;
  inReplyTo?: string;
  references?: string[];
  proposalId?: string;
}

export class EmailMonitorService {
  private config: EmailMonitorConfig | null = null;
  private monitoringActive = false;

  constructor(config?: EmailMonitorConfig) {
    if (config) {
      this.configure(config);
    }
  }

  configure(config: EmailMonitorConfig) {
    this.config = config;
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

    console.log('✅ Email monitoring service ready (manual reply recording available)');
    this.monitoringActive = true;
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