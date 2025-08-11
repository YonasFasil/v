import React from 'react';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Crown, Zap } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradePrompt = true,
  upgradeMessage
}: FeatureGateProps) {
  const { hasFeature, tenantInfo, isLoading } = useTenantFeatures();

  if (isLoading) {
    return (
      <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <FeatureUpgradePrompt 
      feature={feature} 
      message={upgradeMessage}
      currentPlan={tenantInfo?.planName || 'Free'}
    />
  );
}

interface FeatureUpgradePromptProps {
  feature: string;
  message?: string;
  currentPlan: string;
}

function FeatureUpgradePrompt({ feature, message, currentPlan }: FeatureUpgradePromptProps) {
  const featureNames: Record<string, string> = {
    'venue-management': 'Venue Management',
    'customer-management': 'Customer Management', 
    'lead-management': 'Lead Management',
    'proposal-system': 'Proposal System',
    'task-management': 'Task Management',
    'ai-features': 'AI Features',
    'stripe-payments': 'Payment Processing',
    'gmail-integration': 'Gmail Integration',
    'reporting-analytics': 'Advanced Reporting',
    'custom-branding': 'Custom Branding',
    'api-access': 'API Access',
    'priority-support': 'Priority Support'
  };

  const featureName = featureNames[feature] || feature;

  const handleUpgrade = () => {
    // Navigate to billing/upgrade page
    window.location.href = '/billing';
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Lock className="w-5 h-5" />
          {featureName} Upgrade Required
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-amber-700 mb-4">
          {message || `${featureName} is not available in your ${currentPlan} plan. Upgrade to access this feature.`}
        </p>
        <div className="flex gap-2">
          <Button 
            onClick={handleUpgrade}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
          <Button variant="outline" size="sm">
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage limit display component
interface UsageLimitDisplayProps {
  limitName: string;
  currentUsage: number;
  maxAllowed: number;
  unitName?: string;
}

export function UsageLimitDisplay({ 
  limitName, 
  currentUsage, 
  maxAllowed,
  unitName = 'items'
}: UsageLimitDisplayProps) {
  const usagePercentage = maxAllowed > 0 ? (currentUsage / maxAllowed) * 100 : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentUsage >= maxAllowed;

  return (
    <Card className={`${isAtLimit ? 'border-red-200 bg-red-50' : isNearLimit ? 'border-amber-200 bg-amber-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {limitName} Usage
          </span>
          <span className={`text-sm font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-green-600'}`}>
            {currentUsage} / {maxAllowed === -1 ? '∞' : maxAllowed} {unitName}
          </span>
        </div>
        
        {maxAllowed !== -1 && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        )}
        
        {isAtLimit && (
          <div className="flex items-center gap-2 mt-2">
            <Zap className="w-4 h-4 text-red-500" />
            <p className="text-xs text-red-600">
              You've reached your limit. Upgrade to continue.
            </p>
          </div>
        )}
        
        {isNearLimit && !isAtLimit && (
          <div className="flex items-center gap-2 mt-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-amber-600">
              You're approaching your limit. Consider upgrading.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}