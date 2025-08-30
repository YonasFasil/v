import { usePermissions } from '@/hooks/usePermissions';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface FeatureProtectedRouteProps {
  children: React.ReactNode;
  requiredFeature: string;
  featureName: string;
}

export function FeatureProtectedRoute({ 
  children, 
  requiredFeature,
  featureName 
}: FeatureProtectedRouteProps) {
  const { hasFeature, tenantFeatures, isSuperAdmin } = usePermissions();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Super admins have access to all features
    if (isSuperAdmin) {
      return;
    }

    // If tenant features haven't loaded yet, wait
    if (!tenantFeatures) {
      return;
    }

    // Check if the user has the required feature
    if (!hasFeature(requiredFeature)) {
      // Redirect to upgrade page with feature context
      setLocation(`/upgrade-package?feature=${requiredFeature}&featureName=${encodeURIComponent(featureName)}`);
      return;
    }
  }, [hasFeature, requiredFeature, featureName, tenantFeatures, isSuperAdmin, setLocation]);

  // Loading state while checking features
  if (!isSuperAdmin && !tenantFeatures) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Feature not available and redirect will happen
  if (!isSuperAdmin && !hasFeature(requiredFeature)) {
    return null;
  }

  // Feature is available or user is super admin
  return <>{children}</>;
}