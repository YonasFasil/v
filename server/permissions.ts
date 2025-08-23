import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, verifyToken } from './middleware/auth';
import { storage } from './storage';

/**
 * ULTRA-SIMPLE PERMISSION SYSTEM
 * No complex middleware, just basic checks
 */

// Detailed permission list that matches client-side
export const PERMISSIONS = [
  'view_dashboard',
  'manage_events',
  'view_events', 
  'manage_customers',
  'view_customers',
  'manage_venues',
  'view_venues',
  'manage_payments',
  'view_payments',
  'manage_proposals',
  'view_proposals',
  'manage_settings',
  'view_reports',
  'manage_leads',
  'use_ai_features',
  // Legacy simple permissions for backward compatibility
  'dashboard',
  'users', 
  'venues',
  'bookings',
  'customers', 
  'proposals',
  'tasks',
  'payments',
  'settings'
] as const;

// All permissions for tenant admin
export const ALL_PERMISSIONS = [
  'view_dashboard',
  'manage_events',
  'view_events', 
  'manage_customers',
  'view_customers',
  'manage_venues',
  'view_venues',
  'manage_payments',
  'view_payments',
  'manage_proposals',
  'view_proposals',
  'manage_settings',
  'view_reports',
  'manage_leads',
  'use_ai_features'
];

// Default permissions for roles
export const ROLE_PERMISSIONS = {
  'tenant_admin': ALL_PERMISSIONS,
  'tenant_user': ['view_dashboard', 'view_events', 'manage_events', 'view_customers', 'manage_customers', 'view_venues', 'view_proposals', 'manage_proposals'],
  'super_admin': ALL_PERMISSIONS
};

/**
 * Simple function to check if user has permission
 */
export function userHasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  // Direct permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Legacy permission mapping for backward compatibility
  const legacyMappings: Record<string, string[]> = {
    'dashboard': ['view_dashboard'],
    'users': ['manage_settings'], 
    'venues': ['view_venues', 'manage_venues'],
    'bookings': ['view_events', 'manage_events'],
    'customers': ['view_customers', 'manage_customers'], 
    'proposals': ['view_proposals', 'manage_proposals'],
    'tasks': ['manage_events'], // tasks are typically event-related
    'payments': ['view_payments', 'manage_payments'],
    'settings': ['manage_settings']
  };
  
  // Check if user has any permission that satisfies the required permission
  const validPermissions = legacyMappings[requiredPermission] || [];
  for (const userPerm of userPermissions) {
    if (validPermissions.includes(userPerm)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Simple middleware to require authentication and permissions
 */
export function requireAuth(permission?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      console.log(`[AUTH] ${req.method} ${req.path} - Checking auth${permission ? ` with permission '${permission}'` : ''}`);
      
      // Check for auth header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] No valid authorization header');
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Verify token
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (!decoded) {
        console.log('[AUTH] Token verification failed');
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      console.log(`[AUTH] Token decoded for user: ${decoded.id}, role: ${decoded.role}`);

      // Get fresh user data
      const user = await storage.getUser(decoded.id);
      if (!user) {
        console.log(`[AUTH] User ${decoded.id} not found in database`);
        return res.status(401).json({ message: 'User not found' });
      }
      
      if (!user.isActive) {
        console.log(`[AUTH] User ${user.id} is inactive`);
        return res.status(401).json({ message: 'User inactive' });
      }

      console.log(`[AUTH] User found: ${user.id}, role: ${user.role}, permissions:`, user.permissions);

      // Set user on request
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions || [],
        tenantId: user.tenantId
      };

      console.log(`[AUTH] User context set: tenantId=${user.tenantId}, permissions=${JSON.stringify(user.permissions)}`);

      // Super admin bypasses all permission checks
      if (user.role === 'super_admin') {
        console.log('[AUTH] Super admin - bypassing permission checks');
        return next();
      }

      // If permission required, check it
      if (permission) {
        const hasPermission = userHasPermission(user.permissions || [], permission);
        console.log(`[AUTH] Permission check: needs '${permission}', has: ${JSON.stringify(user.permissions)}, result: ${hasPermission}`);
        
        if (!hasPermission) {
          console.log(`[AUTH] Permission denied: User ${user.id} needs '${permission}' but has:`, user.permissions);
          return res.status(403).json({ 
            message: 'Permission denied',
            required: permission,
            userPermissions: user.permissions 
          });
        }
      }

      console.log('[AUTH] Authentication successful, proceeding to route handler');
      next();
    } catch (error) {
      console.error('[AUTH] Authentication error:', error);
      return res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
  };
}

/**
 * Get default permissions for a role
 */
export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
}