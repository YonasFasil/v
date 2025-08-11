import { useQuery } from '@tanstack/react-query';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  industry: string;
  planId: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  status: string;
  planName?: string;
}

export function useTenantFeatures() {
  const { data: tenantInfo, isLoading } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const hasFeature = (featureName: string) => {
    return tenantInfo?.features?.[featureName] === true;
  };

  const getUsageLimit = (limitName: string): number => {
    return tenantInfo?.limits?.[limitName] || 0;
  };

  const isEnterprise = tenantInfo?.planId === 'enterprise';
  const isProfessional = tenantInfo?.planId === 'professional' || isEnterprise;
  const isStarter = tenantInfo?.planId === 'starter' || isProfessional;

  return {
    tenantInfo,
    isLoading,
    hasFeature,
    getUsageLimit,
    isEnterprise,
    isProfessional, 
    isStarter,
    features: tenantInfo?.features || {},
    limits: tenantInfo?.limits || {},
    planId: tenantInfo?.planId,
    planName: tenantInfo?.planName
  };
}