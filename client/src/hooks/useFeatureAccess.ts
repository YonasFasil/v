import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface FeaturePackage {
  id: string;
  name: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

export function useFeatureAccess() {
  const { user } = useAuth();
  
  // Get current tenant's package information
  const { data: packageData, isLoading } = useQuery<FeaturePackage>({
    queryKey: ['/api/tenant/package'],
    enabled: !!user && !user.isSuperAdmin,
  });

  const hasFeature = (feature: string): boolean => {
    // Super admin has access to all features
    if (user?.isSuperAdmin) {
      return true;
    }
    
    // If no package data or loading, deny access
    if (isLoading || !packageData) {
      return false;
    }
    
    return packageData.features[feature] === true;
  };

  const getUsageLimit = (limitType: string): number | undefined => {
    // Super admin has no limits
    if (user?.isSuperAdmin) {
      return undefined;
    }
    
    if (!packageData) {
      return 0;
    }
    
    return packageData.limits[limitType];
  };

  const checkUsageLimit = (limitType: string, currentUsage: number): boolean => {
    const limit = getUsageLimit(limitType);
    
    // No limit means unlimited
    if (limit === undefined) {
      return true;
    }
    
    return currentUsage < limit;
  };

  return {
    hasFeature,
    getUsageLimit,
    checkUsageLimit,
    packageData,
    isLoading,
  };
}

// Feature keys that match the VENUIN_FEATURES in FeaturePackageForm
export const FEATURES = {
  DASHBOARD_ANALYTICS: 'dashboard_analytics',
  BOOKING_MANAGEMENT: 'booking_management',
  CUSTOMER_MANAGEMENT: 'customer_management',
  LEAD_MANAGEMENT: 'lead_management',
  PROPOSAL_SYSTEM: 'proposal_system',
  PAYMENT_PROCESSING: 'payment_processing',
  VENUE_MANAGEMENT: 'venue_management',
  CALENDAR_BOOKING: 'calendar_booking',
  EMAIL_AUTOMATION: 'email_automation',
  TASK_MANAGEMENT: 'task_management',
  REPORTING_ANALYTICS: 'reporting_analytics',
  AI_VOICE_BOOKING: 'ai_voice_booking',
  AI_EMAIL_REPLIES: 'ai_email_replies',
  AI_LEAD_SCORING: 'ai_lead_scoring',
  AI_PROPOSAL_GENERATION: 'ai_proposal_generation',
  STRIPE_CONNECT: 'stripe_connect',
  MULTI_VENUE_SUPPORT: 'multi_venue_support',
  CUSTOM_BRANDING: 'custom_branding',
  API_ACCESS: 'api_access',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];