import type { Request, Response, NextFunction } from 'express';
import { TenantRequest } from './tenantContext';

// Granular permission definitions (following ChatGPT's suggestion)
export interface TenantPermissions {
  // Events & Bookings
  'events:view'?: boolean;
  'events:create'?: boolean;
  'events:edit'?: boolean;
  'events:cancel'?: boolean;
  
  // Proposals
  'proposals:view'?: boolean;
  'proposals:create'?: boolean;
  'proposals:send'?: boolean;
  'proposals:edit'?: boolean;
  
  // Customers & Leads
  'customers:view'?: boolean;
  'customers:create'?: boolean;
  'customers:edit'?: boolean;
  
  // Payments
  'payments:view'?: boolean;
  'payments:record'?: boolean;
  'payments:refund'?: boolean;
  
  // Venues & Spaces
  'venues:view'?: boolean;
  'venues:manage'?: boolean;
  'spaces:view'?: boolean;
  'spaces:manage'?: boolean;
  
  // Reports & Analytics
  'reports:view'?: boolean;
  
  // Communications
  'communications:send_email'?: boolean;
  'communications:send_sms'?: boolean;
  
  // AI Features
  'ai:use'?: boolean;
  
  // Settings & Administration
  'settings:manage'?: boolean;
  'team:manage'?: boolean;
  'billing:manage'?: boolean;
}

// Permission presets for quick role setup
export const PERMISSION_PRESETS: Record<string, TenantPermissions> = {
  owner: {
    'events:view': true, 'events:create': true, 'events:edit': true, 'events:cancel': true,
    'proposals:view': true, 'proposals:create': true, 'proposals:send': true, 'proposals:edit': true,
    'customers:view': true, 'customers:create': true, 'customers:edit': true,
    'payments:view': true, 'payments:record': true, 'payments:refund': true,
    'venues:view': true, 'venues:manage': true, 'spaces:view': true, 'spaces:manage': true,
    'reports:view': true,
    'communications:send_email': true, 'communications:send_sms': true,
    'ai:use': true,
    'settings:manage': true, 'team:manage': true, 'billing:manage': true,
  },
  
  admin: {
    'events:view': true, 'events:create': true, 'events:edit': true, 'events:cancel': true,
    'proposals:view': true, 'proposals:create': true, 'proposals:send': true, 'proposals:edit': true,
    'customers:view': true, 'customers:create': true, 'customers:edit': true,
    'payments:view': true, 'payments:record': true,
    'venues:view': true, 'venues:manage': true, 'spaces:view': true, 'spaces:manage': true,
    'reports:view': true,
    'communications:send_email': true, 'communications:send_sms': true,
    'ai:use': true,
    'settings:manage': true, 'team:manage': true,
  },
  
  manager: {
    'events:view': true, 'events:create': true, 'events:edit': true,
    'proposals:view': true, 'proposals:create': true, 'proposals:send': true,
    'customers:view': true, 'customers:create': true, 'customers:edit': true,
    'payments:view': true, 'payments:record': true,
    'venues:view': true, 'spaces:view': true,
    'reports:view': true,
    'communications:send_email': true,
    'ai:use': true,
  },
  
  staff: {
    'events:view': true, 'events:create': true,
    'proposals:view': true, 'proposals:create': true,
    'customers:view': true, 'customers:create': true,
    'payments:view': true,
    'venues:view': true, 'spaces:view': true,
    'ai:use': true,
  },
  
  viewer: {
    'events:view': true,
    'proposals:view': true,
    'customers:view': true,
    'payments:view': true,
    'venues:view': true, 'spaces:view': true,
    'reports:view': true,
  },
};

// Permission guard middleware
export const requirePermission = (permission: keyof TenantPermissions) => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    // Skip for super admin routes
    if (req.path.startsWith('/api/superadmin')) {
      return next();
    }

    // Check if user has tenant context
    if (!req.tenantId || !req.userRole) {
      return res.status(403).json({ 
        message: 'Tenant access required',
        requiredPermission: permission 
      });
    }

    // Owner and admin roles have all permissions by default
    if (req.userRole === 'owner') {
      return next();
    }

    // Check specific permission
    const userPermissions = (req as any).userPermissions || {};
    if (!userPermissions[permission]) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        requiredPermission: permission,
        currentRole: req.userRole 
      });
    }

    next();
  };
};

// Plan enforcement middleware (following ChatGPT's suggestion)
export const planEnforcer = (feature: string, limitType: string) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Skip for super admin routes
      if (req.path.startsWith('/api/superadmin')) {
        return next();
      }

      if (!req.tenant) {
        return res.status(403).json({ message: 'No tenant context' });
      }

      // TODO: Check tenant's feature package limits
      // For now, allow all operations
      next();
    } catch (error) {
      console.error('Plan enforcement error:', error);
      res.status(500).json({ message: 'Plan validation failed' });
    }
  };
};

// Status gate middleware (following ChatGPT's suggestion)
export const statusGate = (req: TenantRequest, res: Response, next: NextFunction) => {
  // Skip for super admin routes
  if (req.path.startsWith('/api/superadmin')) {
    return next();
  }

  if (!req.tenant) {
    return res.status(403).json({ message: 'No tenant context' });
  }

  const status = req.tenant.status;
  const isBillingRoute = req.path.includes('/billing') || req.path.includes('/payment');

  switch (status) {
    case 'active':
      // Full access
      return next();
      
    case 'past_due':
      // Read-only except billing
      if (req.method !== 'GET' && !isBillingRoute) {
        return res.status(402).json({ 
          message: 'Account past due - read-only mode',
          hint: 'Please update your payment method to restore full access'
        });
      }
      return next();
      
    case 'canceled':
    case 'suspended':
      // Billing-only access
      if (!isBillingRoute) {
        return res.status(402).json({ 
          message: 'Account suspended',
          hint: 'Please contact support or reactivate your subscription'
        });
      }
      return next();
      
    default:
      return res.status(403).json({ message: 'Invalid account status' });
  }
};