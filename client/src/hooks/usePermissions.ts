import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions?: string[];
}

export function usePermissions() {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    console.log('[PERMISSIONS] usePermissions hook starting...');
    // Get user info from token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('super_admin_token');
    console.log('[PERMISSIONS] Found token:', token ? 'YES' : 'NO');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userData = {
          id: payload.id,
          email: payload.email,
          name: payload.name || payload.email?.split('@')[0] || 'User',
          role: payload.role,
          permissions: payload.permissions || []
        };
        setUser(userData);
        
        console.log('[PERMISSIONS] User data from token:', userData);
        console.log('[PERMISSIONS] Raw permissions from token:', userData.permissions);
        
        // Set permissions based on role and explicit permissions
        let rawPermissions = userData.permissions || [];
        
        // Map detailed permissions to simple sidebar permissions
        const detailedToSimpleMap: Record<string, string[]> = {
          'view_dashboard': ['dashboard'],
          'manage_events': ['bookings'],
          'view_events': ['bookings'],
          'manage_customers': ['customers'],
          'view_customers': ['customers'],
          'manage_venues': ['venues'],
          'view_venues': ['venues'],
          'manage_payments': ['payments'],
          'view_payments': ['payments'],
          'manage_proposals': ['proposals'],
          'view_proposals': ['proposals'],
          'manage_settings': ['settings', 'users'],
          'view_reports': ['settings'],
          'manage_leads': ['customers'],
          'use_ai_features': ['settings'],
          // Legacy permissions (already simple)
          'dashboard': ['dashboard'],
          'users': ['users'],
          'venues': ['venues'],
          'bookings': ['bookings'],
          'customers': ['customers'],
          'proposals': ['proposals'],
          'tasks': ['tasks'],
          'payments': ['payments'],
          'settings': ['settings']
        };
        
        // Convert detailed permissions to simple permissions for sidebar
        let userPermissions: string[] = [];
        
        if (userData.role === 'super_admin') {
          userPermissions = ['dashboard', 'users', 'venues', 'bookings', 'customers', 'proposals', 'tasks', 'payments', 'settings'];
        }
        else if (userData.role === 'tenant_admin') {
          // For tenant_admin, always grant all permissions
          userPermissions = ['dashboard', 'users', 'venues', 'bookings', 'customers', 'proposals', 'tasks', 'payments', 'settings'];
        }
        else {
          // For regular users, map their detailed permissions to simple ones
          const simplePermissionsSet = new Set<string>();
          rawPermissions.forEach(perm => {
            const mappedPerms = detailedToSimpleMap[perm] || [];
            mappedPerms.forEach(simplePerm => simplePermissionsSet.add(simplePerm));
          });
          userPermissions = Array.from(simplePermissionsSet);
        }
        
        console.log('[PERMISSIONS] Final permissions assigned:', userPermissions);
        
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error decoding token:', error);
        setUser(null);
        setPermissions([]);
      }
    } else {
      console.log('[PERMISSIONS] No token found, clearing user and permissions');
      setUser(null);
      setPermissions([]);
    }
  }, []);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  const canManage = (resource: string): boolean => {
    return hasPermission(`manage_${resource}`);
  };

  const canView = (resource: string): boolean => {
    return hasPermission(`view_${resource}`) || hasPermission(`manage_${resource}`);
  };

  return {
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManage,
    canView,
    isAdmin: user?.role === 'tenant_admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isTenantAdmin: user?.role === 'tenant_admin',
    isTenantUser: user?.role === 'tenant_user'
  };
}