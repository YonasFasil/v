import { ReactNode } from "react";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertTriangle } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeMessage?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradeMessage = true 
}: FeatureGateProps) {
  const { canAccess, userRole, isAuthenticated } = useFeatureAccess();

  if (!isAuthenticated) {
    return fallback || (
      <Alert className="border-amber-200 bg-amber-50">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          Please log in to access this feature.
        </AlertDescription>
      </Alert>
    );
  }

  if (!canAccess(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradeMessage) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This feature is not available with your current role ({userRole}) or subscription plan. 
            Contact your administrator to gain access to this feature.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Utility component for inline feature checking
interface FeatureCheckProps {
  feature: string;
  children: ReactNode;
}

export function FeatureCheck({ feature, children }: FeatureCheckProps) {
  const { canAccess } = useFeatureAccess();
  
  if (!canAccess(feature)) {
    return null;
  }

  return <>{children}</>;
}