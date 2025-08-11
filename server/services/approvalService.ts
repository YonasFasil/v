import { storage } from '../storage';
import { InsertApprovalRequest, ApprovalRequest, ROLES } from '@shared/schema';

export interface ApprovalRequestData {
  requestType: 'discount' | 'cancellation' | 'refund' | 'rate_change';
  resourceType: string;
  resourceId: string;
  requestData: any;
  reason?: string;
  requestedAmount?: number;
  expiresAt?: Date;
}

class ApprovalService {
  // Create approval request for sensitive actions
  async createApprovalRequest(
    tenantId: string,
    requesterId: string,
    data: ApprovalRequestData
  ): Promise<ApprovalRequest> {
    // Determine appropriate approver based on request type and amount
    const approverId = await this.determineApprover(tenantId, data);
    
    // Set expiration if not provided (default 24 hours)
    const expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

    const approvalRequest: InsertApprovalRequest = {
      tenantId,
      requesterId,
      approverId,
      requestType: data.requestType,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      requestData: data.requestData,
      reason: data.reason,
      requestedAmount: data.requestedAmount?.toString(),
      expiresAt,
      status: 'pending'
    };

    return await storage.createApprovalRequest(approvalRequest);
  }

  // Determine appropriate approver based on request type and tenant hierarchy
  private async determineApprover(tenantId: string, data: ApprovalRequestData): Promise<string | null> {
    try {
      const { requestType, requestedAmount } = data;
      
      // Get tenant admins and managers
      const tenantUsers = await storage.getTenantUsers(tenantId);
      const tenantAdmins = tenantUsers.filter(u => u.role === ROLES.TENANT_ADMIN);
      const managers = tenantUsers.filter(u => u.role === ROLES.MANAGER);

      // Approval hierarchy based on request type and amount
      switch (requestType) {
        case 'discount':
          if (requestedAmount && requestedAmount > 1000) {
            // High-value discounts need tenant admin approval
            return tenantAdmins[0]?.id || null;
          }
          // Regular discounts can be approved by managers
          return managers[0]?.id || tenantAdmins[0]?.id || null;

        case 'refund':
          // All refunds need tenant admin approval
          return tenantAdmins[0]?.id || null;

        case 'cancellation':
          if (requestedAmount && requestedAmount > 5000) {
            // High-value cancellations need tenant admin
            return tenantAdmins[0]?.id || null;
          }
          return managers[0]?.id || tenantAdmins[0]?.id || null;

        case 'rate_change':
          // Rate changes need tenant admin approval
          return tenantAdmins[0]?.id || null;

        default:
          return tenantAdmins[0]?.id || null;
      }
    } catch (error) {
      console.error('Error determining approver:', error);
      return null;
    }
  }

  // Approve request
  async approveRequest(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<ApprovalRequest | null> {
    try {
      const request = await storage.getApprovalRequest(requestId);
      if (!request || request.status !== 'pending') {
        return null;
      }

      if (request.approverId !== approverId) {
        throw new Error('Unauthorized approver');
      }

      if (request.expiresAt && new Date() > request.expiresAt) {
        await storage.updateApprovalRequest(requestId, { status: 'expired' });
        throw new Error('Request has expired');
      }

      // Update request status
      const updatedRequest = await storage.updateApprovalRequest(requestId, {
        status: 'approved',
        approverNotes: notes,
        approvedAt: new Date()
      });

      // Execute the approved action
      await this.executeApprovedAction(updatedRequest);

      return updatedRequest;
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  // Reject request
  async rejectRequest(
    requestId: string,
    approverId: string,
    notes?: string
  ): Promise<ApprovalRequest | null> {
    try {
      const request = await storage.getApprovalRequest(requestId);
      if (!request || request.status !== 'pending') {
        return null;
      }

      if (request.approverId !== approverId) {
        throw new Error('Unauthorized approver');
      }

      return await storage.updateApprovalRequest(requestId, {
        status: 'rejected',
        approverNotes: notes,
        rejectedAt: new Date()
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  // Execute approved action
  private async executeApprovedAction(request: ApprovalRequest): Promise<void> {
    try {
      const { requestType, resourceType, resourceId, requestData } = request;

      switch (requestType) {
        case 'discount':
          if (resourceType === 'booking') {
            await storage.applyBookingDiscount(resourceId, requestData);
          }
          break;

        case 'refund':
          if (resourceType === 'payment') {
            await storage.processRefund(resourceId, requestData);
          }
          break;

        case 'cancellation':
          if (resourceType === 'booking') {
            await storage.cancelBooking(resourceId, requestData);
          }
          break;

        case 'rate_change':
          if (resourceType === 'booking') {
            await storage.updateBookingRates(resourceId, requestData);
          }
          break;

        default:
          console.warn(`Unhandled approval request type: ${requestType}`);
      }
    } catch (error) {
      console.error('Error executing approved action:', error);
      // Mark the request as failed for manual review
      await storage.updateApprovalRequest(request.id, {
        status: 'failed',
        approverNotes: `Execution failed: ${error.message}`
      });
      throw error;
    }
  }

  // Get pending approvals for user
  async getPendingApprovals(userId: string, tenantId?: string): Promise<ApprovalRequest[]> {
    return await storage.getPendingApprovalRequests(userId, tenantId);
  }

  // Get approval history
  async getApprovalHistory(tenantId: string, limit = 50): Promise<ApprovalRequest[]> {
    return await storage.getApprovalHistory(tenantId, limit);
  }

  // Check if action requires approval
  requiresApproval(
    action: string,
    resourceType: string,
    userRole: string,
    amount?: number
  ): boolean {
    // Staff and lower roles need approval for sensitive actions
    if ([ROLES.STAFF, ROLES.CUSTOMER].includes(userRole)) {
      return ['discount', 'refund', 'cancellation'].includes(action);
    }

    // Managers need approval for high-value actions
    if (userRole === ROLES.MANAGER) {
      return (action === 'discount' && amount && amount > 500) ||
             (action === 'refund' && amount && amount > 1000) ||
             action === 'rate_change';
    }

    return false;
  }
}

export const approvalService = new ApprovalService();