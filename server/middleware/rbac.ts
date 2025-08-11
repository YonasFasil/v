import { Request, Response, NextFunction } from 'express';
import { RoleType, ResourceType, ActionType, ROLES, RESOURCES, ACTIONS } from '@shared/schema';
import { storage } from '../storage';

// Extended request interface to include user and tenant context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string | null;
    role: RoleType;
    staffType?: string;
    venueIds?: string[]; // For location-level scoping
  };
  tenant?: {
    id: string;
    name: string;
  };
}

// Permission checking service
class PermissionService {
  // Check if user has permission for specific resource/action
  async hasPermission(
    userId: string,
    tenantId: string | null,
    role: RoleType,
    resource: ResourceType,
    action: ActionType,
    context?: {
      resourceId?: string;
      venueIds?: string[];
      staffType?: string;
    }
  ): Promise<boolean> {
    try {
      // Super admin has all permissions
      if (role === ROLES.SUPER_ADMIN) {
        return true;
      }

      // Get role permissions from database
      const permissions = await storage.getRolePermissions(tenantId, role);
      const permission = permissions.find(p => 
        p.resource === resource && p.action === action
      );

      if (!permission || !permission.isAllowed) {
        return false;
      }

      // Check additional conditions based on role and context
      return await this.checkAdditionalConditions(role, resource, action, context);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  // Check role-specific conditions
  private async checkAdditionalConditions(
    role: RoleType,
    resource: ResourceType,
    action: ActionType,
    context?: {
      resourceId?: string;
      venueIds?: string[];
      staffType?: string;
    }
  ): Promise<boolean> {
    switch (role) {
      case ROLES.MANAGER:
        // Managers can only manage resources in their assigned venues
        if (context?.venueIds && context?.resourceId) {
          // Check if resource belongs to manager's venues
          return await this.checkVenueAccess(context.venueIds, context.resourceId);
        }
        return true;

      case ROLES.STAFF:
        // Staff permissions depend on their type
        if (context?.staffType) {
          return this.checkStaffPermissions(context.staffType, resource, action);
        }
        return true;

      case ROLES.CUSTOMER:
        // Customers can only access their own resources
        return action === ACTIONS.READ && [
          RESOURCES.BOOKINGS, 
          RESOURCES.PROPOSALS
        ].includes(resource as any);

      default:
        return true;
    }
  }

  // Check venue-level access for managers
  private async checkVenueAccess(venueIds: string[], resourceId: string): Promise<boolean> {
    try {
      // This would check if the resource belongs to any of the manager's venues
      const resource = await storage.getResourceVenueId(resourceId);
      return resource ? venueIds.includes(resource.venueId) : false;
    } catch {
      return false;
    }
  }

  // Check staff-type specific permissions
  private checkStaffPermissions(staffType: string, resource: ResourceType, action: ActionType): boolean {
    switch (staffType) {
      case 'sales':
        return ['customers', 'proposals', 'bookings'].includes(resource as string) &&
               ['create', 'read', 'update'].includes(action as string);
      
      case 'event':
        return ['bookings', 'tasks', 'venues'].includes(resource as string);
      
      case 'operations':
        return ['venues', 'services', 'packages'].includes(resource as string);
      
      default:
        return ['read'].includes(action as string);
    }
  }
}

export const permissionService = new PermissionService();

// Middleware factory for role-based access control
export function requirePermission(resource: ResourceType, action: ActionType) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = await permissionService.hasPermission(
        user.id,
        user.tenantId,
        user.role,
        resource,
        action,
        {
          resourceId: req.params.id,
          venueIds: user.venueIds,
          staffType: user.staffType
        }
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: `${resource}:${action}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

// Role-based middleware shortcuts
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Development bypass - check for dev admin header
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-admin'] === 'true') {
    req.user = {
      id: 'dev-super-admin',
      email: 'admin@venuin.dev',
      role: 'super_admin' as RoleType,
      tenantId: null,
      venueIds: [],
      staffType: null
    };
    return next();
  }
  
  if (req.user?.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

export const requireTenantAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Development bypass - check for dev admin header
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-admin'] === 'true') {
    req.user = {
      id: 'dev-tenant-admin',
      email: 'tenant@venuin.dev',
      role: 'tenant_admin' as RoleType,
      tenantId: 'dev-tenant',
      venueIds: [],
      staffType: null
    };
    return next();
  }
  
  const userRole = req.user?.role;
  if (!userRole || !['super_admin', 'tenant_admin'].includes(userRole)) {
    return res.status(403).json({ error: 'Tenant admin access required' });
  }
  next();
};

export const requireManager = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Development bypass - check for dev admin header  
  if (process.env.NODE_ENV === 'development' && req.headers['x-dev-admin'] === 'true') {
    req.user = {
      id: 'dev-manager',
      email: 'manager@venuin.dev', 
      role: 'manager' as RoleType,
      tenantId: 'dev-tenant',
      venueIds: ['dev-venue-1'],
      staffType: null
    };
    return next();
  }
  
  const userRole = req.user?.role;
  if (!userRole || !['super_admin', 'tenant_admin', 'manager'].includes(userRole)) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// Tenant isolation middleware
export function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.tenantId && req.user?.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Tenant access required' });
  }
  next();
}

// Audit logging middleware
export function auditLog(action: string, resourceType: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400 && req.user) {
        storage.createAuditLog({
          tenantId: req.user.tenantId,
          userId: req.user.id,
          action,
          resourceType,
          resourceId: req.params.id || null,
          oldValues: req.method === 'PUT' || req.method === 'PATCH' ? req.body : null,
          newValues: req.method === 'POST' ? req.body : null,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || null,
          metadata: {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode
          }
        }).catch(console.error);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}