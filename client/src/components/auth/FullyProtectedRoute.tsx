import { ProtectedRoute } from './ProtectedRoute';
import { FeatureProtectedRoute } from './FeatureProtectedRoute';

interface FullyProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'tenant_admin' | 'tenant_user';
  requiredFeature?: string;
  featureName?: string;
  redirectTo?: string;
}

export function FullyProtectedRoute({ 
  children, 
  requiredRole = 'tenant_user',
  requiredFeature,
  featureName,
  redirectTo = '/login' 
}: FullyProtectedRouteProps) {
  // First check authentication and role
  const authProtected = (
    <ProtectedRoute requiredRole={requiredRole} redirectTo={redirectTo}>
      {children}
    </ProtectedRoute>
  );

  // If no feature is required, just return auth-protected content
  if (!requiredFeature || !featureName) {
    return authProtected;
  }

  // If feature is required, wrap with feature protection
  return (
    <ProtectedRoute requiredRole={requiredRole} redirectTo={redirectTo}>
      <FeatureProtectedRoute requiredFeature={requiredFeature} featureName={featureName}>
        {children}
      </FeatureProtectedRoute>
    </ProtectedRoute>
  );
}