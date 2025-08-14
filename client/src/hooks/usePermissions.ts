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
    // Get user info from token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('super_admin_token');
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
        
        // Set permissions based on role and explicit permissions
        let userPermissions = userData.permissions || [];
        
        // Super admin has all permissions
        if (userData.role === 'super_admin') {
          userPermissions = [
            'view_dashboard', 'manage_events', 'view_events', 'manage_customers', 'view_customers',
            'manage_venues', 'view_venues', 'manage_payments', 'view_payments', 'manage_proposals',
            'view_proposals', 'manage_settings', 'view_reports', 'manage_leads', 'use_ai_features',
            'manage_users', 'manage_tenants'
          ];
        }
        // Tenant admin has most permissions by default
        else if (userData.role === 'tenant_admin') {
          userPermissions = userPermissions.length > 0 ? userPermissions : [
            'view_dashboard', 'manage_events', 'view_events', 'manage_customers', 'view_customers',
            'manage_venues', 'view_venues', 'manage_payments', 'view_payments', 'manage_proposals',
            'view_proposals', 'manage_settings', 'view_reports', 'manage_leads', 'use_ai_features',
            'manage_users'
          ];
        }
        // Tenant user has basic permissions by default
        else if (userData.role === 'tenant_user') {
          userPermissions = userPermissions.length > 0 ? userPermissions : [
            'view_dashboard', 'view_events', 'manage_events', 'view_customers', 'manage_customers',
            'view_venues', 'view_proposals', 'manage_proposals'
          ];
        }
        
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error decoding token:', error);
        setUser(null);
        setPermissions([]);
      }
    } else {
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