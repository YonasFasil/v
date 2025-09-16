import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  permissions?: string[];
  tenantId?: string;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'premium';
  enabled: boolean;
}

interface TenantFeaturesResponse {
  success: boolean;
  tenant: {
    id: string;
    name: string;
    subscriptionPackageId: string;
  };
  package: {
    id: string;
    name: string;
    price: number;
    features: string[];
    limits: {
      maxVenues: number;
      maxSpaces: number;
      maxUsers: number;
      maxBookingsPerMonth: number;
    };
  };
  features: {
    all: Feature[];
    byCategory: {
      core: Feature[];
      premium: Feature[];
    };
    enabled: Feature[];
    disabled: Feature[];
    summary: {
      enabled: number;
      total: number;
      percentage: number;
    };
  };
  sidebarPermissions: string[];
}

export function usePermissions() {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [tenantFeatures, setTenantFeatures] = useState<Feature[] | null>(null);

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
          permissions: payload.permissions || [],
          tenantId: payload.tenant_id || payload.tenantId
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
          'manage_packages': ['packages'],
          'view_packages': ['packages'],
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
          'packages': ['packages'],
          'settings': ['settings']
        };

        // Convert detailed permissions to simple permissions for sidebar
        let userPermissions: string[] = [];

        if (userData.role === 'super_admin') {
          userPermissions = ['dashboard', 'users', 'venues', 'bookings', 'customers', 'proposals', 'tasks', 'payments', 'settings', 'packages'];
        }
        else if (userData.role === 'tenant_admin') {
          // For tenant_admin, grant permissions based on package features
          // Start with base permissions that are always available
          userPermissions = ['dashboard', 'venues', 'bookings', 'customers', 'payments', 'settings', 'users', 'packages'];
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

  // Use React Query to fetch tenant features with caching
  const { data: tenantFeaturesData, isLoading: isFeaturesLoading, error: featuresError } = useQuery<TenantFeaturesResponse>({
    queryKey: ['/api/tenant-features', user?.tenantId], // Include tenant ID for proper cache key
    queryFn: () => apiRequest(`/api/tenant-features?tenantId=${user?.tenantId}`),
    enabled: !!(user && user.role !== 'super_admin' && user.tenantId),
    staleTime: 0, // No cache for debugging - always refetch
    gcTime: 0, // No cache time
    refetchOnWindowFocus: true, // Enable refetch for debugging
    refetchOnMount: true, // Enable refetch for debugging
  });

  // Update tenant features and permissions when data changes
  useEffect(() => {
    console.log('[PERMISSIONS] Features data received:', tenantFeaturesData);

    if (tenantFeaturesData?.success && tenantFeaturesData.features) {
      const allFeatures = tenantFeaturesData.features.all;
      setTenantFeatures(allFeatures);

      console.log('[PERMISSIONS] Setting tenant features:', allFeatures);

      // Update permissions based on available features (only for tenant_admin)
      if (user?.role === 'tenant_admin') {
        // Use the sidebar permissions directly from the API
        const sidebarPermissions = tenantFeaturesData.sidebarPermissions || [];

        // Add admin permissions that are always available
        const adminPermissions = ['settings', 'users'];
        const finalPermissions = [...new Set([...sidebarPermissions, ...adminPermissions])];

        console.log('[PERMISSIONS] API Response Success:', tenantFeaturesData.success);
        console.log('[PERMISSIONS] Sidebar permissions from API:', sidebarPermissions);
        console.log('[PERMISSIONS] Admin permissions:', adminPermissions);
        console.log('[PERMISSIONS] Final merged permissions:', finalPermissions);
        console.log('[PERMISSIONS] Features enabled:', tenantFeaturesData.features?.summary?.enabled);

        setPermissions(finalPermissions);
      }
      // Also update permissions for regular tenant_user role
      else if (user?.role === 'tenant_user') {
        const sidebarPermissions = tenantFeaturesData.sidebarPermissions || [];
        console.log('[PERMISSIONS] Tenant user - sidebar permissions from API:', sidebarPermissions);
        setPermissions(sidebarPermissions);
      }
    } else if (featuresError) {
      console.error('[PERMISSIONS] Error fetching features:', featuresError);
    }
  }, [tenantFeaturesData, user, featuresError]);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasFeature = (featureId: string): boolean => {
    if (!tenantFeatures) return false;
    return tenantFeatures.some(f => f.id === featureId && f.enabled);
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

  const getEnabledFeatures = (): Feature[] => {
    return tenantFeatures?.filter(f => f.enabled) || [];
  };

  const getDisabledFeatures = (): Feature[] => {
    return tenantFeatures?.filter(f => !f.enabled) || [];
  };

  const getCoreFeatures = (): Feature[] => {
    return tenantFeatures?.filter(f => f.category === 'core') || [];
  };

  const getPremiumFeatures = (): Feature[] => {
    return tenantFeatures?.filter(f => f.category === 'premium') || [];
  };

  return {
    user,
    permissions,
    tenantFeatures,
    loading: isFeaturesLoading && user && user.role !== 'super_admin',
    error: featuresError,
    hasPermission,
    hasFeature,
    hasAnyPermission,
    hasAllPermissions,
    canManage,
    canView,
    getEnabledFeatures,
    getDisabledFeatures,
    getCoreFeatures,
    getPremiumFeatures,
    isAdmin: user?.role === 'tenant_admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
    isTenantAdmin: user?.role === 'tenant_admin',
    isTenantUser: user?.role === 'tenant_user'
  };
}