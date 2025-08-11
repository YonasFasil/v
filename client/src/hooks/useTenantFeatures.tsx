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
}

export function useTenantFeatures() {
  const { data: tenantInfo, isLoading } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    retry: false,
  });

  const hasFeature = (featureName: string) => {
    return tenantInfo?.features?.[featureName] || false;
  };

  const isEnterprise = tenantInfo?.planId === 'enterprise';
  const isProfessional = tenantInfo?.planId === 'professional' || isEnterprise;
  const isStarter = tenantInfo?.planId === 'starter' || isProfessional;

  return {
    tenantInfo,
    isLoading,
    hasFeature,
    isEnterprise,
    isProfessional, 
    isStarter,
    features: tenantInfo?.features || {},
    limits: tenantInfo?.limits || {}
  };
}